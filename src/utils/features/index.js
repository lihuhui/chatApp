/**
 * 风格特征提取模块 - 主入口
 *
 * 流程：消息输入 → 词频统计 / 口头禅 / 语气 / 表情 / 长度 → 风格报告
 *
 * 使用方式：
 *   const features = require('./utils/features')
 *   const report = features.generate(messages, targetSpeaker)
 */

import * as wordFreq from './wordFrequency'
import * as phraseExt from './phraseExtractor'
import * as toneAna from './toneAnalyzer'
import * as emojiAna from './emojiAnalyzer'
import * as lenAna from './lengthAnalyzer'

/**
 * 从解析后的消息列表中提取目标说话人的消息
 * @param {Array} messages - 解析引擎输出的消息数组
 * @param {string} targetSpeaker - 要分析的目标说话人
 * @returns {string[]} 目标说话人的所有消息内容
 */
function getSpeakerMessages(messages, targetSpeaker) {
  return messages
    .filter(m => m.speaker === targetSpeaker)
    .map(m => m.content)
    .filter(content => content && content.trim().length > 0)
}

/**
 * 生成完整的风格特征报告
 * @param {Array} messages - 解析引擎输出的消息数组
 * @param {string} targetSpeaker - 目标说话人昵称
 * @param {Object} [options]
 * @param {boolean} [options.includeRaw] - 是否包含原始频率数据（默认 false）
 * @returns {Object}
 */
function generate(messages, targetSpeaker, options = {}) {
  const includeRaw = options.includeRaw || false

  if (!messages || messages.length === 0) {
    return {
      success: false,
      error: '消息列表为空',
      targetSpeaker,
      speakerMessageCount: 0,
      totalMessages: 0,
      report: null,
      summary: ''
    }
  }

  // 提取目标说话人的消息
  const targetMessages = getSpeakerMessages(messages, targetSpeaker)

  if (targetMessages.length < 3) {
    return {
      success: false,
      error: `"${targetSpeaker}" 的有效消息不足（${targetMessages.length}条，至少需要 3 条）`,
      targetSpeaker,
      speakerMessageCount: targetMessages.length,
      totalMessages: messages.length,
      report: null,
      summary: '消息量不足以生成可靠的风格特征，建议至少导入 5 条以上对方的回复。'
    }
  }

  // 运行各分析器
  const wordResult = wordFreq.analyze(targetMessages)
  const phraseResult = phraseExt.analyze(targetMessages)
  const toneResult = toneAna.analyze(targetMessages)
  const emojiResult = emojiAna.analyze(targetMessages)
  const lengthResult = lenAna.analyze(targetMessages)

  // 构建报告
  const report = {
    targetSpeaker,
    messageCount: targetMessages.length,
    totalMessages: messages.length,
    warning: targetMessages.length < 5
      ? '消息量较少，分析结果仅供参考'
      : undefined,

    vocabulary: {
      topWords: wordResult.topWords.slice(0, 20),
      topBigrams: wordResult.topBigrams.slice(0, 20),
      topTrigrams: wordResult.topTrigrams.slice(0, 10),
      totalTokens: wordResult.totalTokens,
      uniqueTokens: wordResult.uniqueTokens,
      raw: includeRaw ? wordResult.allFrequencies : undefined
    },

    catchphrases: {
      commonStarters: phraseResult.commonStarters,
      commonEndings: phraseResult.commonEndings,
      detectedCatchphrases: phraseResult.detectedCatchphrases,
      fillerFrequency: phraseResult.fillerFrequency
    },

    tone: {
      overallTone: toneResult.overallTone,
      colloquialLevel: toneResult.colloquialLevel,
      colloquialScore: toneResult.colloquialScore,
      modalParticles: toneResult.modalParticleStats,
      punctuation: toneResult.punctuationStats
    },

    emoji: {
      overallStyle: emojiResult.overallStyle,
      totalEmojis: emojiResult.totalEmojis,
      emojiPerMessage: emojiResult.emojiPerMessage,
      topEmojis: emojiResult.topEmojis.slice(0, 5),
      categoryBreakdown: emojiResult.categoryBreakdown
    },

    messageLength: {
      averageLength: lengthResult.averageLength,
      minLength: lengthResult.minLength,
      maxLength: lengthResult.maxLength,
      medianLength: lengthResult.medianLength,
      lengthLevel: lengthResult.lengthLevel,
      stability: lengthResult.stability,
      distribution: lengthResult.distributionPct
    }
  }

  // 生成可读的风格描述
  const summary = generateSummary(report, targetSpeaker)

  return {
    success: true,
    targetSpeaker,
    speakerMessageCount: targetMessages.length,
    totalMessages: messages.length,
    report,
    summary
  }
}

/**
 * 将特征数据转换为可读的风格描述文本
 * 这段文本将作为 AI prompt 的一部分传递给云端大模型
 */
function generateSummary(report, speakerName) {
  const parts = []
  parts.push(`${speakerName}的语言风格特征分析：`)

  // 长度特征
  const len = report.messageLength
  parts.push(`\n【回复长度】${len.lengthLevel}，平均每条 ${len.averageLength} 字，最短 ${len.minLength} 字，最长 ${len.maxLength} 字。${len.stability}。`)
  parts.push(`长度分布：${formatDistribution(len.distribution)}`)

  // 语气和情绪
  const tone = report.tone
  parts.push(`\n【语气风格】整体偏向${tone.colloquialLevel}，${tone.overallTone}。`)

  // 口头禅
  const phrase = report.catchphrases
  if (phrase.detectedCatchphrases.length > 0) {
    const topPhrases = phrase.detectedCatchphrases.slice(0, 5).map(p => `"${p.phrase}"`).join('、')
    parts.push(`\n【习惯用语】常用 ${topPhrases} 等表达。`)
  }
  if (phrase.commonStarters.length > 0) {
    const starters = phrase.commonStarters.slice(0, 3).map(p => `"${p.phrase}"`).join('、')
    parts.push(`句子常以 ${starters} 开头。`)
  }
  if (phrase.commonEndings.length > 0) {
    const endings = phrase.commonEndings.slice(0, 3).map(p => `"${p.phrase}"`).join('、')
    parts.push(`句子常以 ${endings} 结尾。`)
  }
  if (phrase.fillerFrequency > 0.3) {
    parts.push('语气填充词（嗯、呃、那个等）使用较频繁。')
  }

  // 词汇特征
  const vocab = report.vocabulary
  if (vocab.topWords.length > 0) {
    const topWords = vocab.topWords.slice(0, 10).map(w => `"${w.word}"`).join('、')
    parts.push(`\n【高频字】${topWords}`)
  }
  if (vocab.topBigrams.length > 0) {
    const topBigrams = vocab.topBigrams.slice(0, 8).map(w => `"${w.word}"`).join('、')
    parts.push(`【常用词】${topBigrams}`)
  }

  // emoji
  const emoji = report.emoji
  if (emoji.totalEmojis > 0) {
    const topEmojis = emoji.topEmojis.map(e => e.emoji).join(' ')
    parts.push(`\n【表情使用】${emoji.overallStyle}，共使用 ${emoji.totalEmojis} 个表情。常用表情：${topEmojis}`)
  } else {
    parts.push(`\n【表情使用】基本不使用表情符号。`)
  }

  // 标点
  const punct = tone.punctuation
  const punctDesc = []
  if (parseFloat(punct.exclamationMark?.perMessage || '0') > 0.3) punctDesc.push('感叹号')
  if (parseFloat(punct.questionMark?.perMessage || '0') > 0.3) punctDesc.push('问号')
  if (punct.ellipsis?.count > 0) punctDesc.push('省略号')
  if (punct.repeatedPunctuation?.count > 0) punctDesc.push('重复标点')
  if (punctDesc.length > 0) {
    parts.push(`\n【标点习惯】${punctDesc.join('、')}使用较多。`)
  }

  parts.push('\n\n生成回复时，请严格模仿以上特征，包括回复长度、语气、口头禅、表情使用习惯和标点风格。')

  return parts.join('')
}

function formatDistribution(dist) {
  if (!dist) return ''
  return Object.entries(dist)
    .filter(([, v]) => v !== '0%')
    .map(([k, v]) => `${k}: ${v}`)
    .join('，')
}

export {
  generate,
  getSpeakerMessages
}
