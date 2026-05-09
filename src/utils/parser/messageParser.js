/**
 * 聊天记录消息解析器
 * 将原始文本按格式解析为结构化消息数组
 *
 * 输出格式：
 * {
 *   speaker: string,      // 说话人
 *   content: string,      // 消息内容（已合并多行）
 *   timestamp: string,    // 原始时间戳字符串
 *   lineNumber: number    // 原始行号
 * }
 */

/**
 * 按格式解析整段文本
 * @param {string} text
 * @param {{ header: RegExp, dateFormat: string }} patterns
 * @returns {Array<{ speaker: string, content: string, timestamp: string, lineNumber: number }>}
 */
function parseMessages(text, patterns) {
  const lines = text.split('\n')
  const messages = []
  let currentMsg = null
  let lineNumber = 0

  for (const rawLine of lines) {
    lineNumber++
    const line = rawLine.trimEnd()  // 保留开头空格，去掉尾部空格

    // 尝试匹配消息头（时间戳行）
    const match = line.match(patterns.header)

    if (match) {
      // 保存上一条消息
      if (currentMsg) {
        messages.push(finalizeMessage(currentMsg))
      }

      // 开始新消息
      if (patterns.dateFormat === 'pc') {
        // PC: [timestamp] [speaker]
        currentMsg = {
          speaker: match[2].trim(),
          content: '',
          timestamp: match[1].trim(),
          lineNumber
        }
      } else {
        // iOS/Android: [speaker] [timestamp]
        currentMsg = {
          speaker: match[1].trim(),
          content: '',
          timestamp: match[2].trim(),
          lineNumber
        }
      }
    } else if (currentMsg) {
      // 非头部行 → 视为上一条消息的续行（多行消息）
      if (currentMsg.content === '') {
        currentMsg.content = line
      } else {
        currentMsg.content += '\n' + line
      }
    }
    // else: 尚未匹配到任何消息头，跳过（文件头部的空行/无关内容）
  }

  // 最后一条消息
  if (currentMsg) {
    messages.push(finalizeMessage(currentMsg))
  }

  return messages
}

/**
 * 处理消息收尾：去除首尾空白，过滤纯空白消息
 */
function finalizeMessage(msg) {
  return {
    ...msg,
    content: msg.content.trim()
  }
}

/**
 * 检测一行是否为格式匹配的消息头
 * @param {string} line
 * @param {RegExp} headerPattern
 * @returns {boolean}
 */
function isMessageHeader(line, headerPattern) {
  return headerPattern.test(line)
}

export {
  parseMessages,
  isMessageHeader
}
