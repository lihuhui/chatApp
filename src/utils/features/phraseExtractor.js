/**
 * 口头禅提取器
 * 通过 N-gram 频率分析找出目标说话人的习惯用语
 */

// 常见口头禅模式库（用于匹配和标注）
const COMMON_CATCHPHRASE_PATTERNS = [
  '就是说', '也就是说', '不是我说', '我跟你说', '你知道吗',
  '我觉得', '我认为', '我感觉', '我想说', '我的意思是',
  '说实话', '老实说', '讲真的', '说真的', '认真的',
  '其实吧', '其实呢', '话说回来', '不过话说', '对了',
  '然后呢', '然后吧', '结果呢', '反正吧', '总之呢',
  '说白了', '简单说', '换个说法', '换句话说', '不是吗',
  '好吧', '行吧', '算了吧', '罢了', '而已',
  '这样子', '这样的', '那样的', '那样子',
  '厉害了', '可以的', '没毛病', '没问题', '妥妥的',
  '哇塞', '我去', '我靠', '哎呀', '哎哟',
  '嗯嗯', '哦哦', '哈哈', '呵呵', '嘿嘿',
  'emmm', 'emm', '额额', '呃呃'
]

// 语气填充词
const FILLER_WORDS = [
  '嗯', '呃', '哦', '噢', '啊', '哈', '呐', '嘛', '咯', '呗',
  '嗯嗯', '哦哦', '呃呃', '哈哈', '呵呵', '嘿嘿', 'emmm', 'emm',
  '那个', '这个', '就是说', '然后', '反正', '其实', '当然',
  '对', '嗯对', '是的', '没错'
]

/**
 * 从消息列表中提取口头禅
 * @param {string[]} messages - 目标说话人的所有消息
 * @returns {Object}
 */
function analyze(messages) {
  if (!messages || messages.length < 3) {
    return {
      totalMessages: messages?.length || 0,
      commonStarters: [],
      commonEndings: [],
      detectedCatchphrases: [],
      fillerFrequency: 0,
      confidence: 'low'
    }
  }

  // 1. 统计句式开头和结尾
  const starters = {}
  const endings = {}

  for (const msg of messages) {
    const trimmed = msg.trim()
    if (!trimmed) continue

    // 开头 1-4 字
    for (let i = 1; i <= Math.min(4, trimmed.length); i++) {
      const start = trimmed.slice(0, i)
      if (isMeaningfulPhrase(start)) {
        starters[start] = (starters[start] || 0) + 1
      }
    }

    // 结尾 1-4 字
    for (let i = 1; i <= Math.min(4, trimmed.length); i++) {
      const end = trimmed.slice(-i)
      if (isMeaningfulPhrase(end)) {
        endings[end] = (endings[end] || 0) + 1
      }
    }
  }

  // 2. 检测常见口头禅模式
  const catchphraseCounts = {}
  for (const msg of messages) {
    for (const pattern of COMMON_CATCHPHRASE_PATTERNS) {
      if (msg.includes(pattern)) {
        catchphraseCounts[pattern] = (catchphraseCounts[pattern] || 0) + 1
      }
    }
  }

  // 3. 统计填充词使用
  let totalFillers = 0
  let totalMessagesWithFillers = 0

  for (const msg of messages) {
    let hasFiller = false
    for (const filler of FILLER_WORDS) {
      if (msg.includes(filler)) {
        totalFillers++
        hasFiller = true
      }
    }
    if (hasFiller) totalMessagesWithFillers++
  }

  // 排序取 top
  const sortByFreq = (map) =>
    Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([phrase, count]) => ({ phrase, count }))

  const detectedCatchphrases = Object.entries(catchphraseCounts)
    .filter(([, count]) => count >= 2) // 至少出现 2 次才算
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([phrase, count]) => ({ phrase, count }))

  return {
    totalMessages: messages.length,
    commonStarters: sortByFreq(starters),
    commonEndings: sortByFreq(endings),
    detectedCatchphrases,
    fillerFrequency: messages.length > 0 ? (totalFillers / messages.length) : 0,
    fillerMessageRatio: messages.length > 0 ? (totalMessagesWithFillers / messages.length) : 0,
    confidence: messages.length >= 10 ? 'high' : messages.length >= 5 ? 'medium' : 'low'
  }
}

/**
 * 判断是否为有意义的短语（过滤纯数字、单字母等）
 */
function isMeaningfulPhrase(phrase) {
  if (!phrase || phrase.trim().length === 0) return false
  // 纯标点跳过
  if (/^[，。！？、；：\.\,\!\?\;\:\s]+$/.test(phrase)) return false
  // 纯数字跳过
  if (/^\d+$/.test(phrase)) return false
  return true
}

export {
  analyze,
  COMMON_CATCHPHRASE_PATTERNS
}
