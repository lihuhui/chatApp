/**
 * 说话人分析器
 * 统计说话人、去重（合并同音/同义昵称）
 */

/**
 * 分析消息列表中的说话人
 * @param {Array} messages - 过滤后的消息列表
 * @returns {Object}
 */
function analyzeSpeakers(messages) {
  const speakerMap = {}

  for (const msg of messages) {
    if (!speakerMap[msg.speaker]) {
      speakerMap[msg.speaker] = {
        name: msg.speaker,
        messageCount: 0,
        firstLine: msg.lineNumber,
        lastLine: msg.lineNumber
      }
    }
    speakerMap[msg.speaker].messageCount++
    speakerMap[msg.speaker].lastLine = msg.lineNumber
  }

  const speakers = Object.values(speakerMap)
    .sort((a, b) => a.firstLine - b.firstLine)

  return {
    speakers,
    totalSpeakers: speakers.length,
    // 自动判断：说话人超过 2 个可能是群聊
    isGroupChat: speakers.length > 2
  }
}

/**
 * 初步去重——将同一人的不同昵称变体合并
 * 注意：这只是基于规则的简单去重，复杂情况由用户在 UI 中手动确认
 * @param {Array} messages
 * @returns {Array} 消息列表（说话人已归一化）
 */
function deduplicateSpeakers(messages) {
  // 简单实现：对说话人名称做标准化处理
  // 更复杂的去重（同音字、别名）留到 UI 阶段让用户确认
  return messages.map(msg => ({
    ...msg,
    speaker: msg.speaker.replace(/\s+/g, '')  // 去除昵称中的空白
  }))
}

export {
  analyzeSpeakers,
  deduplicateSpeakers
}
