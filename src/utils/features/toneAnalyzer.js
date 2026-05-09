/**
 * 语气分析器
 *
 * 分析维度：
 * 1. 语气词频率
 * 2. 口语化程度
 * 3. 标点符号习惯
 * 4. 句式特点
 */

// 语气词分类
const MODAL_PARTICLES = {
  // 疑问
  question: ['吗', '么', '呢', '啊？', '啥', '谁', '哪', '怎', '难道', '何'],
  // 感叹
  exclamation: ['啊', '呀', '哇', '哦', '噢', '哈', '呵', '哎', '唉', '哟'],
  // 祈使/建议
  imperative: ['吧', '呗', '嘛', '咯', '啦', '咯', '好了', '行了', '算了'],
  // 陈述/确认
  declarative: ['的', '了', '嗯', '哦', '啊', '啦', '咯', '呗', '哈']
}

// 口语化标记
const COLLOQUIAL_MARKS = [
  '哈', '啦', '咯', '呗', '嘛', '耶', '喔',
  '哈哈哈', '嘿嘿', '呵呵', '噗', '啧',
  '好吧', '行吧', '算了', '罢了', '得了',
  '天哪', '天啊', '我的天', '妈呀', '我去',
  '我靠', '我晕', '完了', '不是吧', '真的假的',
  '不会吧', '有没有搞错', '牛逼', '厉害了',
  '笑死', '醉了', '麻了', '绝了', '哭了',
  'emm', 'emmm', 'hmm'
]

// 书面语标记
const FORMAL_MARKS = [
  '因此', '然而', '但是', '虽然', '而且', '并且',
  '此外', '另外', '总之', '综上所述', '基于',
  '鉴于', '关于', '对于', '按照', '根据',
  '敬', '请', '感谢', '抱歉', '非常', '十分',
  '首先', '其次', '最后', '第一', '第二'
]

/**
 * 分析语气特征
 * @param {string[]} messages - 目标说话人的所有消息
 * @returns {Object}
 */
function analyze(messages) {
  if (!messages || messages.length === 0) {
    return {
      totalMessages: 0,
      modalParticleStats: {},
      colloquialScore: 0,
      punctuationStats: {},
      overallTone: '未知',
      confidence: 'low'
    }
  }

  const allText = messages.join('\n')
  const totalChars = allText.length

  // 1. 语气词统计
  const modalStats = {}
  let totalModals = 0

  for (const [category, particles] of Object.entries(MODAL_PARTICLES)) {
    let count = 0
    for (const p of particles) {
      const regex = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
      const matches = allText.match(regex)
      if (matches) count += matches.length
    }
    modalStats[category] = count
    totalModals += count
  }

  // 2. 口语化 / 书面语 程度
  let colloquialCount = 0
  for (const mark of COLLOQUIAL_MARKS) {
    const escaped = mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'g')
    const matches = allText.match(regex)
    if (matches) colloquialCount += matches.length
  }

  let formalCount = 0
  for (const mark of FORMAL_MARKS) {
    const escaped = mark.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'g')
    const matches = allText.match(regex)
    if (matches) formalCount += matches.length
  }

  const colloquialScore = (colloquialCount + formalCount) > 0
    ? colloquialCount / (colloquialCount + formalCount)
    : 0.5

  // 3. 标点习惯
  const punctuationPatterns = {
    exclamationMark: { pattern: /！/g, label: '感叹号' },
    questionMark: { pattern: /？/g, label: '问号' },
    ellipsis: { pattern: /…{2,}|\.{3,}/g, label: '省略号' },
    comma: { pattern: /，|,/g, label: '逗号' },
    period: { pattern: /。|\./g, label: '句号' },
    dash: { pattern: /—{2,}|\-{2,}/g, label: '破折号' },
    quotation: { pattern: /["""「」『』]/g, label: '引号' },
    repeatedPunctuation: { pattern: /[！？]{2,}|[!?]{2,}/g, label: '重复标点(!!)' }
  }

  const punctStats = {}
  for (const [key, { pattern, label }] of Object.entries(punctuationPatterns)) {
    const matches = allText.match(pattern)
    punctStats[key] = {
      label,
      count: matches ? matches.length : 0,
      perMessage: messages.length > 0
        ? ((matches ? matches.length : 0) / messages.length).toFixed(2)
        : '0.00'
    }
  }

  // 4. 整体语气判断
  const overallTone = describeTone(modalStats, colloquialScore, punctStats, messages.length)

  return {
    totalMessages: messages.length,
    totalChars,
    modalParticleStats: {
      detail: modalStats,
      total: totalModals,
      perMessage: messages.length > 0 ? (totalModals / messages.length).toFixed(2) : '0.00'
    },
    colloquialScore: parseFloat(colloquialScore.toFixed(2)),
    colloquialLevel: colloquialScore > 0.7 ? '口语化' : colloquialScore > 0.4 ? '中性' : '偏书面',
    formalityScore: parseFloat((1 - colloquialScore).toFixed(2)),
    punctuationStats: punctStats,
    overallTone,
    confidence: messages.length >= 10 ? 'high' : messages.length >= 5 ? 'medium' : 'low'
  }
}

/**
 * 综合判断语气风格
 */
function describeTone(modalStats, colloquialScore, punctStats, msgCount) {
  if (msgCount < 3) return '样本不足'

  const traits = []

  // 疑问倾向
  const questionRatio = modalStats.question / Math.max(1, msgCount)
  if (questionRatio > 0.3) traits.push('爱提问')
  else if (questionRatio > 0.15) traits.push('偏好奇')

  // 感叹倾向
  const exclaimRatio = modalStats.exclamation / Math.max(1, msgCount)
  if (exclaimRatio > 0.3) traits.push('热烈')
  else if (exclaimRatio > 0.1) traits.push('有情绪')

  // 祈使倾向
  const imperativeRatio = modalStats.imperative / Math.max(1, msgCount)
  if (imperativeRatio > 0.2) traits.push('爱建议')

  // 感叹号使用
  const exclMarkPerMsg = parseFloat(punctStats.exclamationMark?.perMessage || '0')
  if (exclMarkPerMsg > 1) traits.push('情绪饱满')
  else if (exclMarkPerMsg > 0.3) traits.push('略带情绪')

  // 问号使用
  const qMarkPerMsg = parseFloat(punctStats.questionMark?.perMessage || '0')
  if (qMarkPerMsg > 1) traits.push('爱追问')
  else if (qMarkPerMsg > 0.3) traits.push('常提问')

  // 省略号
  const ellipsisCount = punctStats.ellipsis?.count || 0
  if (ellipsisCount > msgCount * 0.2) traits.push('欲言又止')

  // 重复标点
  if ((punctStats.repeatedPunctuation?.count || 0) > msgCount * 0.1) traits.push('表达强烈')

  // 口语化
  if (colloquialScore > 0.8) traits.push('很口语')
  else if (colloquialScore < 0.3) traits.push('偏正式')

  return traits.length > 0 ? traits.join('、') : '中性风格'
}

export {
  analyze,
  MODAL_PARTICLES
}
