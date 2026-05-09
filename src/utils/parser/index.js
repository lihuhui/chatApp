/**
 * 聊天记录解析引擎 - 主入口
 *
 * 流程：格式检测 → 消息解析 → 过滤 → 说话人分析
 *
 * 使用方式：
 *   const parser = require('./utils/parser')
 *   const result = parser.parse(原始文本)
 *   console.log(result.summary)
 */

import { detectFormat, getFormatPatterns } from './formatDetector'
import { parseMessages } from './messageParser'
import { filterMessages } from './filterEngine'
import { analyzeSpeakers, deduplicateSpeakers } from './speakerAnalyzer'

/**
 * 解析整段聊天记录文本
 * @param {string} rawText - 用户粘贴的原始文本
 * @returns {Object}
 */
function parse(rawText) {
  if (!rawText || rawText.trim().length === 0) {
    return {
      success: false,
      error: '输入文本为空',
      messages: [],
      speakers: [],
      summary: null
    }
  }

  // Step 1: 格式检测
  const formatResult = detectFormat(rawText)
  if (formatResult.format === 'unknown') {
    return {
      success: false,
      error: '无法识别的聊天记录格式，请确认复制的是微信聊天记录',
      format: formatResult,
      messages: [],
      speakers: [],
      summary: null
    }
  }

  // Step 2: 获取格式对应的正则
  const patterns = getFormatPatterns(formatResult.format)
  if (!patterns) {
    return {
      success: false,
      error: `不支持的格式: ${formatResult.format}`,
      messages: [],
      speakers: [],
      summary: null
    }
  }

  // Step 3: 解析消息
  const rawMessages = parseMessages(rawText, patterns)

  if (rawMessages.length === 0) {
    return {
      success: false,
      error: '未能解析出任何消息，请检查聊天记录格式是否正确',
      format: formatResult,
      messages: [],
      speakers: [],
      summary: null
    }
  }

  // Step 4: 过滤非对话内容
  const { filtered, removed, stats: filterStats } = filterMessages(rawMessages)

  // Step 5: 说话人去重
  const deduplicated = deduplicateSpeakers(filtered)

  // Step 6: 说话人分析
  const speakerAnalysis = analyzeSpeakers(deduplicated)

  return {
    success: true,
    format: formatResult,
    messages: deduplicated,
    speakers: speakerAnalysis.speakers,
    isGroupChat: speakerAnalysis.isGroupChat,
    removed,
    summary: {
      totalRawLines: rawText.split('\n').length,
      totalMessages: rawMessages.length,
      afterFilter: filtered.length,
      removedCount: filterStats.filtered,
      removedByType: filterStats.byType,
      totalSpeakers: speakerAnalysis.totalSpeakers,
      isGroupChat: speakerAnalysis.isGroupChat
    }
  }
}

export {
  parse
}
