/**
 * uniCloud 云函数调用助手
 *
 * 提供两个调用方式：
 *   1. call(name, data) — 直调云函数（推荐，无需 URL 配置）
 *   2. getUrl(name)     — 获取云函数 HTTP 触发器 URL（用于配置 BASE_URL）
 *
 * 使用方式：
 *   import cloud from '@/utils/cloud'
 *   const res = await cloud.call('chat-generate', { message: '你好' })
 */

// 当 uniCloud 可用时使用 callFunction，否则抛错引导用户配置
let callAvailable = false

// #ifndef H5
try {
  if (typeof uniCloud !== 'undefined' && uniCloud.callFunction) {
    callAvailable = true
  }
} catch (e) {
  callAvailable = false
}
// #endif

/**
 * 调用云函数
 * @param {string} name - 云函数名
 * @param {Object} data - 参数
 * @returns {Promise<any>} 云函数返回的 data 字段
 */
async function call(name, data = {}) {
  if (callAvailable) {
    try {
      const res = await uniCloud.callFunction({ name, data })
      const result = res.result

      if (!result) throw new Error('云函数无返回值')

      // 处理云函数返回的业务错误码
      if (result.code === 200) return result.data
      if (result.code === 429) {
        const err = new Error(result.error || '请求过于频繁')
        err.name = 'RateLimitError'
        throw err
      }
      if (result.code === 400) {
        const err = new Error(result.error || '请求参数错误')
        err.name = 'ApiError'
        err.code = 400
        throw err
      }
      if (result.code >= 500) {
        const err = new Error(result.error || '服务暂不可用')
        err.name = 'ServerError'
        throw err
      }

      return result
    } catch (err) {
      if (err.name === 'RateLimitError' || err.name === 'ApiError' || err.name === 'ServerError') {
        throw err
      }
      console.error('[cloud.call] 调用失败:', err)
      throw new Error('网络请求失败，请检查网络设置')
    }
  }

  // uniCloud 不可用（H5 或未配置）
  throw new Error('当前环境不支持直调云函数，请使用 HTTP API 方式')
}

export default {
  call
}
