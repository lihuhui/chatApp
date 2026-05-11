'use strict';

/**
 * baidu-ocr 云函数
 *
 * 调用百度 OCR API 识别图片中的文字。
 * 接收前端上传的图片 base64 数据，返回识别出的文本。
 *
 * 环境变量（在 uniCloud 控制台 → 云函数 → baidu-ocr → 配置 中设置）:
 *   BAIDU_OCR_API_KEY    - 百度 OCR API Key（必填）
 *   BAIDU_OCR_SECRET_KEY - 百度 OCR Secret Key（必填）
 *
 * 请求参数:
 *   images - base64 字符串数组（不含 data:image/... 前缀）
 *
 * 响应:
 *   { code: 200, data: { text: '识别出的文字' } }
 *   { code: 400, error: '...' } — 参数错误
 *   { code: 500, error: '...' } — 服务错误
 */

const API_KEY = process.env.BAIDU_OCR_API_KEY || ''
const SECRET_KEY = process.env.BAIDU_OCR_SECRET_KEY || ''

// 百度 OCR 接口地址
const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token'
const OCR_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic'

exports.main = async function (event, context) {
  try {
    // 检查配置
    if (!API_KEY || !SECRET_KEY) {
      return {
        code: 500,
        error: 'OCR 服务未配置（缺少 BAIDU_OCR_API_KEY 或 BAIDU_OCR_SECRET_KEY）',
      }
    }

    const params = typeof event.body === 'string' ? JSON.parse(event.body) : event
    const { images } = params

    if (!images || !Array.isArray(images) || images.length === 0) {
      return { code: 400, error: '缺少图片数据' }
    }

    // 获取 access_token
    const accessToken = await getAccessToken()

    // 逐张识别
    const allTexts = []
    for (let i = 0; i < images.length; i++) {
      const text = await recognizeImage(accessToken, images[i])
      if (text.trim()) {
        allTexts.push(text.trim())
      }
    }

    return {
      code: 200,
      data: {
        text: allTexts.join('\n\n'),
        image_count: images.length,
      },
    }
  } catch (e) {
    console.error('[baidu-ocr] 错误:', e.message, e.stack)
    return { code: 500, error: '文字识别失败：' + e.message }
  }
}

/**
 * 获取百度 OCR access_token
 * POST https://aip.baidubce.com/oauth/2.0/token
 */
async function getAccessToken() {
  const url = `${TOKEN_URL}?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`

  const res = await fetch(url, { method: 'POST', timeout: 10000 })

  if (!res.ok) {
    throw new Error(`获取 access_token 失败（HTTP ${res.status}）`)
  }

  const data = await res.json()

  if (data.error) {
    throw new Error(`百度鉴权失败：${data.error_description || data.error}`)
  }

  return data.access_token
}

/**
 * 调用百度 OCR accurate_basic 接口识别单张图片
 * @param {string} accessToken
 * @param {string} imageBase64 - 纯 base64 字符串（不含 data:image 前缀）
 * @returns {Promise<string>} 识别出的文字
 */
async function recognizeImage(accessToken, imageBase64) {
  const url = `${OCR_URL}?access_token=${accessToken}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `image=${encodeURIComponent(imageBase64)}`,
    timeout: 30000,
  })

  if (!res.ok) {
    throw new Error(`OCR 请求失败（HTTP ${res.status}）`)
  }

  const data = await res.json()

  if (data.error_code) {
    // token 过期则重试一次
    if (data.error_code === 110 || data.error_code === 111) {
      const newToken = await getAccessToken()
      return recognizeImage(newToken, imageBase64)
    }
    throw new Error(`OCR 识别失败（${data.error_code}）：${data.error_msg}`)
  }

  // 提取识别结果
  const words = (data.words_result || []).map(item => item.words)
  return words.join('\n')
}
