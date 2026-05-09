/**
 * 聊天生成 API
 *
 * 职责：生成 AI 回复，优先走云函数，失败降级到本地模拟
 *
 * 使用方式：
 *   import { generateReply } from '@/api/chat'
 *   const reply = await generateReply(sessionId, userMessage, styleReport)
 */

import cloud from '@/utils/cloud'
import { useUserStore } from '@/store/user'

/**
 * 生成 AI 回复
 * @param {string} sessionId - 当前会话 ID
 * @param {string} userMessage - 用户刚发的消息
 * @param {Object} [styleReport] - 风格分析报告（features.generate 的输出）
 * @param {Object} [options] - 额外参数
 * @param {string} [options.roleName] - 对方昵称
 * @param {Array} [options.contextMessages] - 最近几轮上下文 [{sender, content}]
 * @returns {Promise<{content: string, messageId: string}>}
 */
export async function generateReply(sessionId, userMessage, styleReport, options = {}) {
  const roleName = options.roleName || styleReport?.targetSpeaker || ''

  // 缺少对方昵称时跳过云函数（会拿到 400 错误），直接走本地
  if (!roleName) {
    console.warn('[chat] 缺少 role_name，使用本地模拟回复')
    return mockFallback(userMessage, styleReport)
  }

  // 尝试云函数
  try {
    const userStore = useUserStore()
    const data = await cloud.call('chat-generate', {
      user_id: userStore.userId,
      session_id: sessionId,
      role_name: roleName,
      message: userMessage,
      style_features: styleReport?.report || null,
      style_summary: styleReport?.summary || '',
      context: options.contextMessages || []
    })
    return {
      content: data.reply,
      messageId: data.message_id || `msg_${Date.now()}`
    }
  } catch (err) {
    console.warn('[chat] 云函数调用失败，降级到本地模拟:', err.message)
    return mockFallback(userMessage, styleReport)
  }
}

/**
 * 本地模拟回复（开发 / 降级用）
 */
function mockFallback(userMessage, styleReport) {
  const speaker = styleReport?.targetSpeaker || 'AI'

  if (styleReport?.report) {
    const r = styleReport.report
    const avgLen = r.messageLength?.averageLength || 15
    const useEmoji = r.emoji?.totalEmojis > 0
    const tone = r.tone?.overallTone || ''
    const topWords = (r.vocabulary?.topWords || []).slice(0, 3).map(w => w.word || w)

    return {
      content: mockByStyle(userMessage, avgLen, useEmoji, tone, topWords),
      messageId: `mock_${Date.now()}`
    }
  }

  return {
    content: genericReply(userMessage),
    messageId: `mock_${Date.now()}`
  }
}

function mockByStyle(message, avgLen, useEmoji, tone, topWords) {
  const len = Math.max(4, Math.round(avgLen + (Math.random() - 0.5) * 10))
  let reply = ''

  if (tone.includes('提问') || tone.includes('好奇')) {
    reply = pick([
      '那你是怎么想的呢？',
      '真的吗？展开说说？',
      '为什么你会这么觉得？',
      '然后呢然后呢？',
      '还有这种事？'
    ])
  } else if (tone.includes('随性') || tone.includes('口语')) {
    reply = pick([
      '哈哈是吧，我也觉得',
      '嗯嗯，说的对',
      '哎对对对，就是这样的',
      '好嘞，那就这么办',
      '哈哈好的吧😄'
    ])
  } else if (tone.includes('正式') || tone.includes('礼貌')) {
    reply = pick([
      '好的，我了解了，谢谢',
      '明白了，我会注意的',
      '嗯，你说得有道理',
      '收到，那我先这样',
      '好的，没问题'
    ])
  } else {
    reply = genericReply(message)
  }

  if (topWords.length > 0 && Math.random() > 0.5) {
    const word = topWords[Math.floor(Math.random() * topWords.length)]
    if (!reply.startsWith(word)) {
      reply = word + ' ' + reply
    }
  }

  if (reply.length > len) {
    reply = reply.slice(0, len)
  }

  return reply
}

function genericReply(message) {
  const replies = [
    '哈哈，你说得对！',
    '嗯嗯，我在听呢，然后呢？',
    '这个我倒是没想到，有意思。',
    '对啊对啊，我也是这么觉得的！',
    '让我想想… 好像也是哦。',
    '说得有道理！',
    '嗯，然后呢？',
    '真的吗？那可太有意思了。',
    '好的好的，我知道了。',
    '哈哈，也是哦。',
    '嗯嗯，你继续说。',
    '诶，你这么一说我也觉得。',
    '那后来呢？',
    '行吧，那就这样。'
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
