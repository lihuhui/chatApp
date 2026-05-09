/**
 * 跨端同步 API
 *
 * 通过 cloud.call 调用 sync-api 云函数实现跨端同步。
 * 接口文档（项目文档 2.4.2 节）对应关系：
 *   上传角色       → cloud.call('sync-api', { action: 'uploadRole', ... })
 *   获取角色列表   → cloud.call('sync-api', { action: 'getRoles', ... })
 *   同步对话记录   → cloud.call('sync-api', { action: 'syncMessages', ... })
 *   获取对话历史   → cloud.call('sync-api', { action: 'getMessages', ... })
 *   创建会话       → cloud.call('sync-api', { action: 'createSession', ... })
 *   获取会话列表   → cloud.call('sync-api', { action: 'getSessions', ... })
 */

import cloud from '@/utils/cloud'
import { useUserStore } from '@/store/user'

/**
 * 自动注入 user_id（如果未显式传入）
 */
function ensureUserId(params) {
  if (params.userId || params.user_id) return params
  try {
    const store = useUserStore()
    if (store.isReady) {
      return { ...params, userId: store.userId }
    }
  } catch { /* store 未初始化 */ }
  return params
}

/**
 * 调用 sync-api 云函数
 */
async function callSync(action, params = {}) {
  const data = ensureUserId(params)
  return await cloud.call('sync-api', { action, ...data })
}

/**
 * 上传角色（App 端调用）
 * @param {Object} params
 * @param {string} params.userId - 用户标识
 * @param {string} params.name - 角色昵称
 * @param {string} [params.avatar] - 头像 URL
 * @param {string} [params.styleFeatures] - 风格特征文本
 * @param {number} [params.messageCount] - 导入消息总数
 * @returns {Promise<{roleId: string}>}
 */
export async function uploadRole(params) {
  const result = await callSync('uploadRole', {
    user_id: params.userId,
    name: params.name,
    avatar: params.avatar || '',
    style_features: params.styleFeatures || '',
    message_count: params.messageCount || 0,
  })
  return { roleId: result.role_id, created: result.created }
}

/**
 * 获取角色列表（小程序端调用）
 * @param {string} userId
 * @returns {Promise<{roles: Array}>}
 */
export async function getRoleList(userId) {
  const result = await callSync('getRoles', { user_id: userId })
  return result
}

/**
 * 创建新会话
 * @param {Object} params
 * @param {string} params.roleId - 角色 ID
 * @param {string} [params.title] - 会话标题
 * @returns {Promise<{sessionId: string}>}
 */
export async function createSession(params) {
  const result = await callSync('createSession', {
    role_id: params.roleId,
    title: params.title || '新对话',
  })
  return { sessionId: result.session_id }
}

/**
 * 获取角色的会话列表
 * @param {string} roleId
 * @returns {Promise<{sessions: Array}>}
 */
export async function getSessions(roleId) {
  return await callSync('getSessions', { role_id: roleId })
}

/**
 * 同步对话记录（App 端调用，增量同步）
 * @param {Object} params
 * @param {string} params.sessionId - 云端会话 ID
 * @param {string} params.roleId - 角色 ID
 * @param {Array} params.messages - 消息列表
 * @param {number} [params.roundCount] - 当前总轮数
 * @returns {Promise<{syncedCount: number}>}
 */
export async function syncMessages(params) {
  const result = await callSync('syncMessages', {
    session_id: params.sessionId,
    role_id: params.roleId,
    messages: params.messages.map(m => ({
      sender: m.sender,
      content: m.content,
      created_at: m.createdAt || Date.now(),
    })),
    round_count: params.roundCount || 0,
  })
  return { syncedCount: result.synced_count }
}

/**
 * 获取对话历史（小程序端调用，分页）
 * @param {string} sessionId
 * @param {number} [page=1]
 * @param {number} [pageSize=50]
 * @returns {Promise<{messages: Array, pagination: Object}>}
 */
export async function getMessageHistory(sessionId, page = 1, pageSize = 50) {
  return await callSync('getMessages', {
    session_id: sessionId,
    page,
    page_size: pageSize,
  })
}

/**
 * 删除角色（含关联数据）
 * @param {string} roleId
 * @returns {Promise<{deleted: boolean}>}
 */
export async function deleteRole(roleId) {
  return await callSync('deleteRole', { role_id: roleId })
}

export default {
  uploadRole,
  getRoleList,
  createSession,
  getSessions,
  syncMessages,
  getMessageHistory,
  deleteRole,
}
