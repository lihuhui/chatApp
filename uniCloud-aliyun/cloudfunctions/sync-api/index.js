'use strict';

/**
 * sync-api 云函数
 *
 * 跨端同步 API，提供角色/会话/消息的云端 CRUD。
 * 供 App 端上传、小程序端拉取使用。
 *
 * action 列表:
 *   uploadRole     — App 端上传角色
 *   getRoles       — 获取用户角色列表
 *   createSession  — 创建新会话
 *   getSessions    — 获取角色的会话列表
 *   syncMessages   — App 端增量同步消息
 *   getMessages    — 获取会话消息列表（分页）
 *   deleteRole     — 删除角色及关联数据
 *
 * 请求格式: { action: 'uploadRole', ...params }
 * 响应格式: { code: 200, data: { ... } }
 *           { code: 400, error: '...' }
 *           { code: 500, error: '...' }
 */

exports.main = async function (event, context) {
  const { action } = event

  if (!action) {
    return { code: 400, error: '缺少 action 参数' }
  }

  try {
    switch (action) {
      case 'uploadRole':
        return await uploadRole(event)
      case 'getRoles':
        return await getRoles(event)
      case 'createSession':
        return await createSession(event)
      case 'getSessions':
        return await getSessions(event)
      case 'syncMessages':
        return await syncMessages(event)
      case 'getMessages':
        return await getMessages(event)
      case 'deleteRole':
        return await deleteRole(event)
      default:
        return { code: 400, error: `未知 action: ${action}` }
    }
  } catch (e) {
    console.error(`[sync-api] ${action} 错误:`, e.message)
    return { code: 500, error: e.message || '操作失败' }
  }
}

// ──────────────────────────────
//  角色
// ──────────────────────────────

/**
 * 上传/创建角色
 * 请求: { user_id, name, avatar, style_features, message_count }
 */
async function uploadRole(event) {
  const { user_id, name, avatar, style_features, message_count } = event

  if (!user_id || !name) {
    return { code: 400, error: 'user_id 和 name 不能为空' }
  }

  const db = uniCloud.database()
  const coll = db.collection('cloud_roles')

  // 检查是否已存在同名角色
  const existing = await coll.where({ user_id, name }).get()

  if (existing.data && existing.data.length > 0) {
    // 更新已有角色
    const doc = existing.data[0]
    await coll.doc(doc._id).update({
      avatar: avatar || doc.avatar,
      style_features: style_features || doc.style_features,
      message_count: message_count || doc.message_count,
      updated_at: Date.now(),
    })
    return { code: 200, data: { role_id: doc._id, created: false } }
  }

  // 新建角色
  const result = await coll.add({
    user_id,
    name,
    avatar: avatar || '',
    style_features: style_features || '',
    message_count: message_count || 0,
    created_at: Date.now(),
    updated_at: Date.now(),
  })

  return { code: 200, data: { role_id: result.id, created: true } }
}

/**
 * 获取用户角色列表
 * 请求: { user_id }
 */
async function getRoles(event) {
  const { user_id } = event

  if (!user_id) {
    return { code: 400, error: 'user_id 不能为空' }
  }

  const db = uniCloud.database()
  const rolesColl = db.collection('cloud_roles')
  const sessionsColl = db.collection('cloud_sessions')

  // 查询该用户所有角色，按更新时间倒序
  const result = await rolesColl
    .where({ user_id })
    .orderBy('updated_at', 'desc')
    .get()

  const roles = (result.data || []).map(r => ({
    role_id: r._id,
    name: r.name,
    avatar: r.avatar || '',
    message_count: r.message_count || 0,
    style_features: r.style_features || '',
    created_at: r.created_at,
  }))

  // 为每个角色补充最近会话标题
  const enriched = await Promise.all(
    roles.map(async (role) => {
      try {
        const sessResult = await sessionsColl
          .where({ role_id: role.role_id })
          .orderBy('updated_at', 'desc')
          .limit(1)
          .get()
        const lastSession = sessResult.data?.[0]
        return {
          ...role,
          last_session_title: lastSession?.title || '',
          last_session_time: lastSession?.updated_at || null,
        }
      } catch {
        return role
      }
    })
  )

  return { code: 200, data: { roles: enriched } }
}

/**
 * 删除角色及关联数据
 * 请求: { role_id }
 */
async function deleteRole(event) {
  const { role_id } = event

  if (!role_id) {
    return { code: 400, error: 'role_id 不能为空' }
  }

  const db = uniCloud.database()

  // 删除角色
  await db.collection('cloud_roles').doc(role_id).remove()

  // 查找关联会话
  const sessions = await db.collection('cloud_sessions').where({ role_id }).get()
  const sessionIds = (sessions.data || []).map(s => s._id)

  // 删除会话
  if (sessionIds.length > 0) {
    await db.collection('cloud_sessions').where({ role_id }).remove()
    // 删除关联消息
    await db.collection('cloud_messages').where({ role_id }).remove()
  }

  return { code: 200, data: { deleted: true } }
}

// ──────────────────────────────
//  会话
// ──────────────────────────────

/**
 * 创建新会话
 * 请求: { role_id, user_id, title }
 */
async function createSession(event) {
  const { role_id, user_id, title } = event

  if (!role_id || !user_id) {
    return { code: 400, error: 'role_id 和 user_id 不能为空' }
  }

  const db = uniCloud.database()

  const result = await db.collection('cloud_sessions').add({
    role_id,
    user_id,
    title: title || '新对话',
    round_count: 0,
    status: 'active',
    created_at: Date.now(),
    updated_at: Date.now(),
  })

  return { code: 200, data: { session_id: result.id } }
}

/**
 * 获取角色的会话列表
 * 请求: { role_id }
 */
async function getSessions(event) {
  const { role_id } = event

  if (!role_id) {
    return { code: 400, error: 'role_id 不能为空' }
  }

  const db = uniCloud.database()
  const result = await db.collection('cloud_sessions')
    .where({ role_id })
    .orderBy('updated_at', 'desc')
    .get()

  const sessions = (result.data || []).map(s => ({
    session_id: s._id,
    role_id: s.role_id,
    title: s.title || '',
    round_count: s.round_count || 0,
    status: s.status || 'active',
    created_at: s.created_at,
    updated_at: s.updated_at,
  }))

  return { code: 200, data: { sessions } }
}

// ──────────────────────────────
//  消息
// ──────────────────────────────

/**
 * 增量同步消息（App 端 → 云端）
 * 请求: { session_id, role_id, user_id, messages[], round_count }
 *   messages: [{ sender: 'user'|'ai', content: string, created_at }]
 */
async function syncMessages(event) {
  const { session_id, role_id, user_id, messages, round_count } = event

  if (!session_id || !messages || !Array.isArray(messages) || messages.length === 0) {
    return { code: 400, error: '参数不完整' }
  }

  const db = uniCloud.database()
  const coll = db.collection('cloud_messages')

  // 批量插入消息
  const now = Date.now()
  const docs = messages.map((m, i) => ({
    session_id,
    role_id: role_id || '',
    user_id: user_id || '',
    sender: m.sender === 'ai' ? 'ai' : 'user',
    content: m.content || '',
    type: 'text',
    created_at: m.created_at || now + i,
  }))

  let syncedCount = 0
  for (const doc of docs) {
    await coll.add(doc)
    syncedCount++
  }

  // 更新会话轮数和状态
  if (session_id) {
    const updateData = {
      updated_at: now,
      round_count: round_count || db.command.inc(syncedCount),
    }
    if (round_count >= 30) {
      updateData.status = 'full'
    }
    try {
      await db.collection('cloud_sessions').where({ _id: session_id }).update(updateData)
    } catch {
      // 会话不存在则忽略
    }
  }

  return { code: 200, data: { synced_count: syncedCount } }
}

/**
 * 获取对话历史（分页）
 * 请求: { session_id, page, page_size }
 */
async function getMessages(event) {
  const { session_id, page = 1, page_size = 50 } = event

  if (!session_id) {
    return { code: 400, error: 'session_id 不能为空' }
  }

  const db = uniCloud.database()
  const coll = db.collection('cloud_messages')

  const pageNum = Math.max(1, parseInt(page))
  const size = Math.min(100, Math.max(1, parseInt(page_size)))
  const skip = (pageNum - 1) * size

  // 获取总数
  const countResult = await coll.where({ session_id }).count()
  const total = countResult.total || 0

  // 获取消息列表（按时间正序）
  const result = await coll
    .where({ session_id })
    .orderBy('created_at', 'asc')
    .skip(skip)
    .limit(size)
    .get()

  const messages = (result.data || []).map(m => ({
    message_id: m._id,
    sender: m.sender,
    content: m.content,
    created_at: m.created_at,
  }))

  return {
    code: 200,
    data: {
      messages,
      pagination: {
        page: pageNum,
        page_size: size,
        total,
        total_pages: Math.ceil(total / size),
      },
    },
  }
}
