/**
 * 聊天记录格式检测器
 * 自动识别 iOS / Android / PC 三种微信导出格式
 *
 * iOS:     昵称 2024/1/15 14:30:22      (带秒，日期用 /)
 * Android: 昵称 2024/1/15 14:30         (不带秒，日期用 /)
 * PC:      2024-01-15 14:30:22 昵称     (带秒，日期用 -，时间在前)
 */

const FORMAT_TYPES = {
  IOS: 'ios',
  ANDROID: 'android',
  PC: 'pc',
  UNKNOWN: 'unknown'
}

// iOS: "昵称 2024/1/15 14:30:22"
const IOS_PATTERN = /^(.+?)\s+(\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}:\d{2})$/

// Android: "昵称 2024/1/15 14:30"（无秒）
const ANDROID_PATTERN = /^(.+?)\s+(\d{4}\/\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2})$/

// PC: "2024-01-15 14:30:22 昵称"
const PC_PATTERN = /^(\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{2}:\d{2})\s+(.+)$/

/**
 * 检测单行属于哪种格式
 * @param {string} line
 * @returns {string|null} 格式类型或 null
 */
function detectLineFormat(line) {
  if (IOS_PATTERN.test(line)) return FORMAT_TYPES.IOS
  if (PC_PATTERN.test(line)) return FORMAT_TYPES.PC
  // Android 检测要排除 iOS（iOS 也匹配 Android pattern，因为 iOS 时间包含 Android 时间）
  if (ANDROID_PATTERN.test(line) && !IOS_PATTERN.test(line)) return FORMAT_TYPES.ANDROID
  return null
}

/**
 * 自动检测整段文本的格式
 * 扫描前 20 个非空行，取匹配最多的格式
 * @param {string} text
 * @returns {{ format: string, confidence: number }}
 */
function detectFormat(text) {
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  const sampleLines = lines.slice(0, 20)

  const scores = { [FORMAT_TYPES.IOS]: 0, [FORMAT_TYPES.ANDROID]: 0, [FORMAT_TYPES.PC]: 0 }

  for (const line of sampleLines) {
    const fmt = detectLineFormat(line)
    if (fmt && scores[fmt] !== undefined) {
      scores[fmt]++
    }
  }

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  if (total === 0) {
    return { format: FORMAT_TYPES.UNKNOWN, confidence: 0 }
  }

  let bestFormat = FORMAT_TYPES.UNKNOWN
  let bestScore = 0

  for (const [fmt, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestFormat = fmt
    }
  }

  // 三种格式的正则互斥（/ vs -，时间位置不同），不会交叉匹配
  // 置信度 = 最佳格式匹配数 / 总匹配数（全部匹配同格式则为 1.0）
  return {
    format: bestFormat,
    confidence: total > 0 ? bestScore / total : 0
  }
}

/**
 * 获取格式对应的解析正则
 * @param {string} format
 * @returns {{ header: RegExp, dateFormat: string }}
 */
function getFormatPatterns(format) {
  switch (format) {
    case FORMAT_TYPES.IOS:
      return { header: IOS_PATTERN, dateFormat: 'ios' }
    case FORMAT_TYPES.ANDROID:
      return { header: ANDROID_PATTERN, dateFormat: 'android' }
    case FORMAT_TYPES.PC:
      return { header: PC_PATTERN, dateFormat: 'pc' }
    default:
      return null
  }
}

export {
  FORMAT_TYPES,
  detectFormat,
  detectLineFormat,
  getFormatPatterns
}
