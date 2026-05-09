/**
 * UUID v4 生成器
 *
 * 纯 JS 实现，不依赖任何第三方库。
 * 用于生成全局唯一的用户标识。
 */

/**
 * 生成 UUID v4
 * 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * @returns {string}
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

/**
 * 生成简短唯一 ID（用于会话、消息等）
 * @returns {string}
 */
function generateShortId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export { generateUUID, generateShortId }
