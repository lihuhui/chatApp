/**
 * 网络请求封装
 *
 * 统一处理：请求发送、响应解析、错误码、token 管理、限流、网络异常
 *
 * 使用方式：
 *   import request from '@/api/request'
 *   const data = await request.get('/roles')
 *   const res = await request.post('/chat/generate', { message: '你好' })
 */

// ──────────────────────────────
//  配置
// ──────────────────────────────

// #ifdef APP-PLUS
const BASE_URL = 'https://api.ai-chat.example.com/v1'
// #endif
// #ifdef MP-WEIXIN
const BASE_URL = 'https://api.ai-chat.example.com/v1'
// #endif

const REQUEST_TIMEOUT = 15000 // 15s

import { useUserStore } from '@/store/user'

// 错误码（与云端约定一致）
const ERROR_CODES = {
  SUCCESS: 200,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
}

// ──────────────────────────────
//  错误类
// ──────────────────────────────

class ApiError extends Error {
  constructor(message, code, data = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.data = data
  }
}

class NetworkError extends Error {
  constructor() {
    super('网络连接失败，请检查网络设置')
    this.name = 'NetworkError'
  }
}

class RateLimitError extends ApiError {
  constructor() {
    super('请求过于频繁，请稍后再试')
    this.name = 'RateLimitError'
    this.code = ERROR_CODES.RATE_LIMITED
  }
}

class ServerError extends ApiError {
  constructor() {
    super('服务暂不可用，请稍后再试')
    this.name = 'ServerError'
    this.code = ERROR_CODES.SERVER_ERROR
  }
}

// ──────────────────────────────
//  Token 管理
// ──────────────────────────────

const TOKEN_KEY = 'ai_chat_token'

/**
 * 获取存储的 token
 */
function getToken() {
  try {
    return uni.getStorageSync(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

/**
 * 保存 token
 */
function setToken(token) {
  uni.setStorageSync(TOKEN_KEY, token)
}

/**
 * 清除 token
 */
function removeToken() {
  try {
    uni.removeStorageSync(TOKEN_KEY)
  } catch {
    // ignore
  }
}

// ──────────────────────────────
//  用户标识注入
// ──────────────────────────────

/**
 * 自动注入 user_id（如果尚未携带）
 * 优先级：显式传入 > store 中的 userId
 */
function injectUserId(data) {
  if (data && data.user_id) return data
  try {
    const store = useUserStore()
    if (store.isReady) {
      return { ...data, user_id: store.userId }
    }
  } catch {
    // store 尚未初始化，跳过
  }
  return data
}

// ──────────────────────────────
//  核心请求方法
// ──────────────────────────────

/**
 * 发起请求
 * @param {Object} options
 * @param {string} options.url - 接口路径（自动拼接 BASE_URL）
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [options.method='GET']
 * @param {Object} [options.data] - 请求参数
 * @param {Object} [options.header] - 自定义请求头
 * @param {boolean} [options.showLoading=false] - 是否显示加载中
 * @param {boolean} [options.showError=true] - 失败时是否 toast 错误
 * @param {number} [options.timeout=15000] - 超时时间
 * @returns {Promise<any>}
 */
async function request(options) {
  const {
    url,
    method = 'GET',
    data: rawData = {},
    header = {},
    showLoading = false,
    showError = true,
    timeout = REQUEST_TIMEOUT
  } = options

  // 自动注入用户标识
  const data = injectUserId(rawData)

  // 网络状态预检
  const netType = uni.getNetworkTypeSync?.()
  if (netType === 'none') {
    const err = new NetworkError()
    if (showError) uni.showToast({ title: err.message, icon: 'none' })
    throw err
  }

  // 加载提示
  if (showLoading) {
    uni.showLoading({ title: '加载中...', mask: true })
  }

  // 构建请求头
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...header
  }

  try {
    const response = await uniRequest({
      url: BASE_URL + url,
      method,
      data,
      header: headers,
      timeout
    })

    return handleResponse(response, { showError })
  } catch (err) {
    if (err.name === 'ApiError') {
      if (showError && err.code !== ERROR_CODES.RATE_LIMITED) {
        uni.showToast({ title: err.message, icon: 'none' })
      }
      throw err
    }
    // 网络层异常
    const netErr = new NetworkError()
    if (showError) uni.showToast({ title: netErr.message, icon: 'none' })
    throw netErr
  } finally {
    if (showLoading) uni.hideLoading()
  }
}

/**
 * 封装 uni.request（Promise 化）
 */
function uniRequest(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: options.url,
      method: options.method,
      data: options.data,
      header: options.header,
      timeout: options.timeout,
      success: (res) => resolve(res),
      fail: (err) => {
        // uni.request fail 通常是网络层错误
        reject(new Error(err.errMsg || '网络请求失败'))
      }
    })
  })
}

/**
 * 统一处理响应
 *
 * 兼容两种响应格式：
 *   1. 标准 REST API：HTTP 状态码 = 业务状态码
 *   2. uniCloud HTTP 触发器：HTTP 状态码始终为 200，业务状态码在 body.code 中
 */
function handleResponse(response, { showError }) {
  const { statusCode, data } = response

  // ── uniCloud 格式：body 中包含 code/data/error ──
  if (data && typeof data.code === 'number') {
    switch (data.code) {
      case 200:
        return data.data
      case 429: {
        const err = new RateLimitError()
        err.message = data.error || err.message
        throw err
      }
      case 400:
        throw new ApiError(data.error || '请求参数错误', 400, data)
      case 401:
        removeToken()
        throw new ApiError(data.error || '登录已过期', 401)
      default:
        if (data.code >= 500) throw new ServerError()
        throw new ApiError(data.error || `请求失败(${data.code})`, data.code)
    }
  }

  // ── 标准 HTTP 状态码 ──
  switch (statusCode) {
    case ERROR_CODES.SUCCESS:
      return data

    case ERROR_CODES.RATE_LIMITED:
      throw new RateLimitError()

    case ERROR_CODES.SERVER_ERROR:
    case ERROR_CODES.SERVICE_UNAVAILABLE:
      throw new ServerError()

    case 401: {
      removeToken()
      throw new ApiError('登录已过期，请重新登录', 401)
    }

    default: {
      const msg = data?.message || `请求失败(${statusCode})`
      throw new ApiError(msg, statusCode, data)
    }
  }
}

// ──────────────────────────────
//  快捷方法
// ──────────────────────────────

const api = {
  get(url, data, options = {}) {
    return request({ ...options, url, method: 'GET', data })
  },

  post(url, data, options = {}) {
    return request({ ...options, url, method: 'POST', data })
  },

  put(url, data, options = {}) {
    return request({ ...options, url, method: 'PUT', data })
  },

  delete(url, data, options = {}) {
    return request({ ...options, url, method: 'DELETE', data })
  }
}

// 附加工具方法
api.setToken = setToken
api.getToken = getToken
api.removeToken = removeToken
api.ApiError = ApiError
api.NetworkError = NetworkError
api.RateLimitError = RateLimitError
api.ServerError = ServerError

export default api
