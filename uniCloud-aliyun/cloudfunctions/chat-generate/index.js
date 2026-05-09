'use strict';

/**
 * chat-generate 云函数（统一版）
 *
 * AI 回复生成服务。使用 cloud_* 集合，与 sync-api 保持一致的数据库设计。
 *
 * 环境变量（在 uniCloud 控制台 → 云函数 → chat-generate → 配置 中设置）:
 *   LLM_API_KEY      - API 密钥（必填，生产环境）
 *   LLM_BASE_URL     - API 基础地址（默认 https://api.openai.com/v1）
 *   LLM_MODEL        - 模型名称（默认 gpt-4o-mini）
 *   RATE_LIMIT_DAILY - 单用户每日上限（默认 100）
 *
 * 请求参数:
 *   session_id      - 会话 ID
 *   user_id         - 用户标识
 *   role_name       - 对方昵称
 *   message         - 用户消息（必填）
 *   style_features  - 风格分析报告对象
 *   style_summary   - 风格描述文本
 *   context         - 上下文消息列表 [{sender, content}]
 *
 * 响应:
 *   { code: 200, data: { reply, message_id, tokens_used } }
 *   { code: 400, error: '...' }  — 参数错误
 *   { code: 429, error: '...' }  — 频率超限
 *   { code: 500, error: '...' }  — 服务错误
 */

// ──────────────────────────────
//  配置
// ──────────────────────────────

const CFG = {
  llmApiKey: process.env.LLM_API_KEY || '',
  llmBaseUrl: (process.env.LLM_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
  llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',
  rateLimitDaily: parseInt(process.env.RATE_LIMIT_DAILY) || 100,
  maxContextRounds: 10,
  maxTotalRounds: 30,
}

// ──────────────────────────────
//  主入口
// ──────────────────────────────

exports.main = async function (event, context) {
  try {
    // 统一参数解析（HTTP 触发 vs 直调）
    const params = parseEvent(event)
    const { session_id, user_id, role_name, message, style_features, style_summary, context: contextMessages } = params

    // 参数校验
    if (!message || typeof message !== 'string' || !message.trim()) {
      return { code: 400, error: '消息内容不能为空' }
    }
    if (!session_id) {
      return { code: 400, error: '缺少会话标识 session_id' }
    }

    const userId = user_id || context.uniIdUser?.uid || 'anonymous'
    const speakerName = role_name || '对方'

    // 限流检查
    const rateCheck = await checkRateLimit(userId)
    if (!rateCheck.allowed) {
      return { code: 429, error: rateCheck.message }
    }

    // 轮数上限检查
    const roundCheck = await checkRoundLimit(session_id)
    if (!roundCheck.allowed) {
      return { code: 400, error: `已达 ${CFG.maxTotalRounds} 轮对话上限` }
    }

    // 构建 Prompt
    const messages = buildPrompt({
      message: message.trim(),
      styleSummary: style_summary || '',
      styleFeatures: style_features || null,
      speakerName,
      context: contextMessages || [],
    })

    // 调用 LLM 生成回复
    let reply
    let tokensUsed = 0

    if (CFG.llmApiKey) {
      const result = await callLLM(messages)
      reply = result.content
      tokensUsed = result.tokensUsed
    } else {
      console.warn('[chat-generate] 未配置 LLM_API_KEY，使用本地模板')
      reply = localReply(message, speakerName, style_features)
      tokensUsed = 50
    }

    // 持久化到云数据库
    let cloudMessageId = ''
    try {
      const dbResult = await persistConversation(userId, session_id, speakerName, message.trim(), reply)
      cloudMessageId = dbResult.messageId
    } catch (e) {
      console.warn('[chat-generate] 持久化失败:', e.message)
    }

    return {
      code: 200,
      data: {
        reply,
        message_id: cloudMessageId || `msg_${Date.now()}`,
        tokens_used: tokensUsed,
      },
    }
  } catch (e) {
    console.error('[chat-generate] 错误:', e.message, e.stack)
    return { code: 500, error: 'AI 回复生成失败，请稍后再试' }
  }
}

// ──────────────────────────────
//  参数解析
// ──────────────────────────────

function parseEvent(event) {
  // HTTP 触发场景：event.body 是 JSON 字符串
  if (event.httpMethod && event.body) {
    try {
      return typeof event.body === 'string' ? JSON.parse(event.body) : event.body
    } catch {
      throw new Error('请求体 JSON 解析失败')
    }
  }
  return event
}

// ──────────────────────────────
//  Prompt 构建
// ──────────────────────────────

function buildPrompt({ message, styleSummary, styleFeatures, speakerName, context }) {
  const recent = context.slice(-CFG.maxContextRounds)
  const parts = []

  parts.push(`你是一个微信聊天风格模仿助手。请以"${speakerName}"的身份，像真实微信聊天一样回复用户。`)
  parts.push('')
  parts.push('【核心规则】')
  parts.push('1. 回复要自然口语化，像真人发微信，不要像AI')
  parts.push('2. 严格控制回复长度，不要长篇大论')
  parts.push('3. 不要解释你在模仿角色，不要用"作为AI"这类表述')
  parts.push('4. 适当使用口头禅和高频词，但不要刻意堆砌')
  parts.push('5. 根据风格特征决定是否使用表情符号')
  parts.push('6. 保持对话感，可以反问、可以接话、可以吐槽')
  parts.push('')

  // 注入风格特征
  if (styleSummary) {
    parts.push(`【目标风格】\n${styleSummary}`)
  } else if (styleFeatures) {
    const f = styleFeatures
    if (f.report) {
      const r = f.report
      if (r.messageLength) {
        parts.push(`- 回复长度：平均 ${r.messageLength.averageLength || '?'} 字/条`)
      }
      if (r.tone) {
        parts.push(`- 语气：${r.tone.overallTone || '自然'}`)
      }
      if (r.vocabulary?.topWords?.length > 0) {
        const words = r.vocabulary.topWords.slice(0, 8).map(w => w.word || w).join('、')
        parts.push(`- 高频词：${words}`)
      }
      if (r.emoji?.totalEmojis > 0) {
        parts.push(`- 常用表情：${(r.emoji.types || []).slice(0, 4).join(' ')}`)
      }
    }
  } else {
    parts.push('（无特定风格数据，请以自然的日常聊天风格回复）')
  }

  parts.push('')
  parts.push(`现在请以"${speakerName}"的身份回复：`)

  const systemMsg = parts.join('\n')

  // 构建消息列表
  const msgs = [{ role: 'system', content: systemMsg }]
  for (const msg of recent) {
    msgs.push({
      role: msg.sender === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    })
  }
  msgs.push({ role: 'user', content: message })

  return msgs
}

// ──────────────────────────────
//  LLM API 调用
// ──────────────────────────────

async function callLLM(messages) {
  const url = `${CFG.llmBaseUrl}/chat/completions`

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CFG.llmApiKey}`,
      },
      body: JSON.stringify({
        model: CFG.llmModel,
        messages,
        temperature: 0.75,
        max_tokens: 600,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.3,
      }),
      timeout: 20000,
    })
  } catch (e) {
    throw new Error(`网络请求失败: ${e.message}`)
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    if (response.status === 429) throw new Error('请求频率超限')
    if (response.status === 401) throw new Error('API 密钥无效')
    throw new Error(`LLM API 返回 ${response.status}: ${body.slice(0, 200)}`)
  }

  const data = await response.json()
  if (!data.choices?.[0]?.message?.content) {
    throw new Error('LLM 返回内容为空')
  }

  return {
    content: data.choices[0].message.content.trim(),
    tokensUsed: data.usage?.total_tokens || 0,
  }
}

// ──────────────────────────────
//  本地模板回复（开发/降级用）
// ──────────────────────────────

function localReply(message, speakerName, styleFeatures) {
  const templates = [
    '哈哈，你说得对！',
    '嗯嗯，我在听呢，然后呢？',
    '这个我倒是没想到，有意思。',
    '对啊对啊，我也是这么觉得的！',
    '让我想想… 好像也是哦。',
    '说得有道理！',
    '真的吗？那可太有意思了。',
    '好的好的，我知道了。',
    '哈哈，也是哦😄',
    '嗯嗯，你继续说。',
    '诶，你这么一说我也觉得。',
    '那后来呢？',
    '对，我也是这么想的。',
    '哈哈，笑死🤣',
  ]
  let reply = templates[Math.floor(Math.random() * templates.length)]

  // 尝试插入高频词
  const topWords = styleFeatures?.vocabulary?.topWords
  if (topWords?.length > 0 && Math.random() > 0.6) {
    const w = topWords[0]
    const word = typeof w === 'string' ? w : w.word
    if (word && !reply.startsWith(word)) {
      reply = `${word} ${reply}`
    }
  }

  return reply
}

// ──────────────────────────────
//  限流检查（rate_limits 集合）
// ──────────────────────────────

async function checkRateLimit(userId) {
  const today = new Date().toISOString().slice(0, 10)
  const db = uniCloud.database()
  const coll = db.collection('rate_limits')

  try {
    const query = { user_id: userId, date: today }
    const existing = await coll.where(query).get()

    if (existing.data && existing.data.length > 0) {
      const record = existing.data[0]
      if (record.count >= CFG.rateLimitDaily) {
        return {
          allowed: false,
          message: `今日对话次数已用完（${CFG.rateLimitDaily}次），请明天再来`,
        }
      }
      await coll.doc(record._id).update({ count: record.count + 1 })
    } else {
      await coll.add({ user_id: userId, date: today, count: 1, created_at: Date.now() })
    }

    return { allowed: true }
  } catch (e) {
    console.warn('[rate-limit] 检查异常:', e.message)
    return { allowed: true }
  }
}

// ──────────────────────────────
//  轮数上限检查
// ──────────────────────────────

async function checkRoundLimit(sessionId) {
  const db = uniCloud.database()
  try {
    const session = await db.collection('cloud_sessions').doc(sessionId).get()
    if (session.data && session.data.length > 0) {
      const roundCount = session.data[0].round_count || 0
      if (roundCount >= CFG.maxTotalRounds) {
        return { allowed: false }
      }
    }
    return { allowed: true }
  } catch (e) {
    console.warn('[round-limit] 检查异常:', e.message)
    return { allowed: true }
  }
}

// ──────────────────────────────
//  云端持久化（cloud_messages + cloud_sessions）
// ──────────────────────────────

async function persistConversation(userId, sessionId, roleName, userMessage, aiReply) {
  const db = uniCloud.database()
  const now = Date.now()

  // 确保 cloud_sessions 中存在该会话（首次发送时创建）
  try {
    const existing = await db.collection('cloud_sessions').doc(sessionId).get()
    if (!existing.data || existing.data.length === 0) {
      // 会话不存在，新建
      await db.collection('cloud_sessions').add({
        _id: sessionId,
        user_id: userId,
        role_name: roleName || '',
        title: userMessage.slice(0, 30),
        round_count: 0,
        status: 'active',
        created_at: now,
        updated_at: now,
      })
    }
  } catch (e) {
    console.warn('[persist] 查询/创建会话异常:', e.message)
  }

  // 保存用户消息
  const uMsg = await db.collection('cloud_messages').add({
    session_id: sessionId,
    sender: 'user',
    content: userMessage,
    type: 'text',
    user_id: userId,
    created_at: now,
  })

  // 保存 AI 回复
  const aMsg = await db.collection('cloud_messages').add({
    session_id: sessionId,
    sender: 'ai',
    content: aiReply,
    type: 'text',
    user_id: userId,
    created_at: now + 1,
  })

  // 更新会话轮数
  try {
    await db.collection('cloud_sessions').doc(sessionId).update({
      round_count: db.command.inc(1),
      updated_at: now,
    })
  } catch (e) {
    console.warn('[persist] 更新会话失败:', e.message)
  }

  return { messageId: aMsg.id || `msg_${now}` }
}
