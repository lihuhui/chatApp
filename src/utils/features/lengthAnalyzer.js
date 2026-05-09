/**
 * 回复长度分析器
 * 统计目标说话人的消息长度分布
 */

/**
 * 分析回复长度分布
 * @param {string[]} messages - 目标说话人的所有消息
 * @returns {Object}
 */
function analyze(messages) {
  if (!messages || messages.length === 0) {
    return {
      totalMessages: 0,
      averageLength: 0,
      minLength: 0,
      maxLength: 0,
      medianLength: 0,
      stdDeviation: 0,
      distribution: {},
      lengthLevel: '未知'
    }
  }

  // 计算每条消息的字符数（不含 emoji，按实际显示长度）
  const lengths = messages.map(msg => {
    // 去除 emoji 计算纯文本长度
    const textOnly = msg.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // 但 emoji 本身也占显示长度，所以综合计算
    const totalChars = [...msg].length
    return totalChars
  })

  const total = lengths.reduce((a, b) => a + b, 0)
  const count = lengths.length
  const sorted = [...lengths].sort((a, b) => a - b)

  const average = total / count
  const min = sorted[0]
  const max = sorted[count - 1]
  const median = count % 2 === 0
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
    : sorted[Math.floor(count / 2)]

  // 标准差
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - average, 2), 0) / count
  const stdDev = Math.sqrt(variance)

  // 分布区间
  const distribution = {
    '1-5字': 0,
    '6-10字': 0,
    '11-20字': 0,
    '21-50字': 0,
    '51-100字': 0,
    '100+字': 0
  }

  for (const len of lengths) {
    if (len <= 5) distribution['1-5字']++
    else if (len <= 10) distribution['6-10字']++
    else if (len <= 20) distribution['11-20字']++
    else if (len <= 50) distribution['21-50字']++
    else if (len <= 100) distribution['51-100字']++
    else distribution['100+字']++
  }

  // 百分比
  const distributionPct = {}
  for (const [range, cnt] of Object.entries(distribution)) {
    distributionPct[range] = count > 0 ? parseFloat((cnt / count * 100).toFixed(1)) + '%' : '0%'
  }

  // 长度风格描述
  let lengthLevel
  if (average <= 5) lengthLevel = '极简（嗯嗯哦哦党）'
  else if (average <= 10) lengthLevel = '简短'
  else if (average <= 20) lengthLevel = '适中'
  else if (average <= 50) lengthLevel = '话多'
  else lengthLevel = '话痨（小作文选手）'

  // 稳定性描述
  let stability
  const cv = stdDev / Math.max(average, 0.1) // 变异系数
  if (count < 3) stability = '样本不足'
  else if (cv < 0.5) stability = '稳定（回复长度很一致）'
  else if (cv < 1) stability = '较稳定'
  else stability = '不稳定（忽长忽短）'

  // 最短/最长消息的显示
  let shortestMessage = ''
  let longestMessage = ''
  if (messages.length > 0) {
    const minIdx = lengths.indexOf(min)
    const maxIdx = lengths.indexOf(max)
    if (minIdx >= 0) shortestMessage = messages[minIdx].substring(0, 50)
    if (maxIdx >= 0) longestMessage = messages[maxIdx].substring(0, 50)
  }

  return {
    totalMessages: count,
    averageLength: parseFloat(average.toFixed(1)),
    minLength: min,
    maxLength: max,
    medianLength: parseFloat(median.toFixed(1)),
    stdDeviation: parseFloat(stdDev.toFixed(1)),
    coefficientOfVariation: parseFloat(cv.toFixed(2)),
    distribution,
    distributionPct,
    lengthLevel,
    stability,
    totalChars: total,
    shortestMessage: shortestMessage + (shortestMessage.length >= 50 ? '...' : ''),
    longestMessage: longestMessage + (longestMessage.length >= 50 ? '...' : ''),
    confidence: messages.length >= 10 ? 'high' : messages.length >= 5 ? 'medium' : 'low'
  }
}

export {
  analyze
}
