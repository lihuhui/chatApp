/**
 * 词频统计器
 *
 * 纯 JS 实现，不依赖 NLP 库。
 * 方案：字符级分析（unigram + bigram）+ 简单模式匹配。
 * 对风格分析而言，字符级统计已能提供足够信号量。
 */

// 停用词（中文单字虚词 + 常见无意义单字）
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人',
  '都', '一', '个', '上', '也', '很', '到', '说', '要', '去',
  '你', '会', '着', '没', '看', '好', '自', '己', '这', '那',
  '么', '吧', '吗', '啊', '呢', '哦', '嗯', '哈', '嘿', '哟',
  '呀', '哇', '呵', '唉', '啦', '嘛', '呗', '呐', '噢', '喔',
  '他', '她', '它', '们', '与', '对', '把', '被', '让', '给',
  '向', '从', '以', '为', '于', '之', '而', '且', '但', '或',
  '如', '因', '所', '能', '可', '应', '该', '还', '已', '将',
  '并', '及', '比', '做', '当', '更', '最', '太', '真', '正',
  '过', '来', '出', '进', '开', '回', '里', '下', '后', '前',
  '中', '外', '只', '才', '再', '又', '刚', '先', '总', '老',
  '小', '大', '多', '少', '几', '两', '点', '些', '每', '各',
  '哪', '谁', '怎', '什', '什', '什', '么',
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'can', 'could', 'should', 'may', 'might',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
  'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
  'their', 'this', 'that', 'these', 'those', 'am', 'to',
  'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as',
  'into', 'through', 'during', 'before', 'after', 'about',
  'between', 'under', 'over', 'out', 'off', 'up', 'down',
  'and', 'but', 'or', 'not', 'so', 'if', 'than', 'then',
  'also', 'very', 'just', 'like'
])

// 中文标点 + 英文标点
const PUNCTUATION_REGEX = /[，。！？、；：""''「」【】《》（）\-\—\~\·\.\,\!\?\;\:\'\"\(\)\[\]\{\}\s\n\r\t]+/g

// 提取中文和英文字符
const CHINESE_REGEX = /[\u4e00-\u9fff]/g
const ENGLISH_REGEX = /[a-zA-Z]+/g
const NUMBER_REGEX = /\d+/g

/**
 * 从内容中提取所有"词"
 * 中文：字符级（单字 + 相邻双字组合）
 * 英文：单词级
 * @param {string} content
 * @returns {string[]} 词列表
 */
function tokenize(content) {
  if (!content) return []
  const tokens = []

  // 清理标点
  const cleaned = content.replace(PUNCTUATION_REGEX, ' ')

  // 提取英文单词
  const englishMatches = cleaned.match(ENGLISH_REGEX)
  if (englishMatches) {
    tokens.push(...englishMatches.map(w => w.toLowerCase()))
  }

  // 提取中文字符并生成 unigram + bigram
  const chineseChars = content.match(CHINESE_REGEX)
  if (chineseChars && chineseChars.length > 0) {
    // Unigram（单字）
    for (const char of chineseChars) {
      // 跳过单字停用词
      if (!STOP_WORDS.has(char)) {
        tokens.push(char)
      }
    }

    // Bigram（双字组合）— 用于捕捉常见词汇
    for (let i = 0; i < chineseChars.length - 1; i++) {
      const bigram = chineseChars[i] + chineseChars[i + 1]
      // 双字组合不过滤停用词（如"可以"的重字有意义）
      tokens.push(bigram)
    }

    // Trigram（三字组合）— 用于捕捉三字短语
    for (let i = 0; i < chineseChars.length - 2; i++) {
      const trigram = chineseChars[i] + chineseChars[i + 1] + chineseChars[i + 2]
      tokens.push(trigram)
    }
  }

  return tokens
}

/**
 * 统计词频
 * @param {string[]} messages - 目标说话人的所有消息内容
 * @param {Object} [options]
 * @param {number} [options.topN=30] - 返回前 N 个高频词
 * @param {boolean} [options.includeBigram=true] - 是否包含双字组合
 * @returns {Object}
 */
function analyze(messages, options = {}) {
  const topN = options.topN || 30
  const includeBigram = options.includeBigram !== false

  if (!messages || messages.length === 0) {
    return {
      totalMessages: 0,
      totalTokens: 0,
      uniqueTokens: 0,
      topWords: [],
      topBigrams: [],
      topTrigrams: []
    }
  }

  // 合并所有消息
  const allText = messages.join('\n')

  // 分词
  const tokens = tokenize(allText)

  // 统计
  const freqMap = {}
  const bigramFreqMap = {}
  const trigramFreqMap = {}

  for (const token of tokens) {
    if (token.length === 1 && !CHINESE_REGEX.test(token)) {
      // 单个英文字母跳过
      continue
    }

    if (token.length === 1) {
      freqMap[token] = (freqMap[token] || 0) + 1
    } else if (token.length === 2) {
      bigramFreqMap[token] = (bigramFreqMap[token] || 0) + 1
    } else if (token.length === 3) {
      trigramFreqMap[token] = (trigramFreqMap[token] || 0) + 1
    }
  }

  // 排序取 top
  const sortByFreq = (map) =>
    Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([word, count]) => ({ word, count }))

  const totalTokens = tokens.length
  const uniqueTokens = Object.keys(freqMap).length +
    Object.keys(bigramFreqMap).length +
    Object.keys(trigramFreqMap).length

  return {
    totalMessages: messages.length,
    totalTokens,
    uniqueTokens,
    topWords: sortByFreq(freqMap),
    topBigrams: sortByFreq(bigramFreqMap),
    topTrigrams: sortByFreq(trigramFreqMap),
    // 去重合并的全量频率数据（给报告生成器用）
    allFrequencies: {
      unigrams: freqMap,
      bigrams: bigramFreqMap,
      trigrams: trigramFreqMap
    }
  }
}

export {
  analyze,
  tokenize,
  STOP_WORDS
}
