/**
 * 聊天记录过滤引擎
 * 过滤非对话内容：系统消息、红包、转账、图片、语音、视频、小程序卡片等
 */

// 过滤规则列表：匹配到任一规则的消息将被过滤
const FILTER_RULES = [
  // === 系统消息 ===
  { type: '系统消息', pattern: /^"?.+?"?\s+(撤回了一条消息|拒绝了你的好友请求|开启了朋友验证|修改群名为)/ },
  { type: '系统消息', pattern: /^(你|我)已(添加|通过).+?(为好友|朋友)/ },
  { type: '系统消息', pattern: /^你(和|与).+?的聊天记录$/ },
  { type: '系统消息', pattern: /^以上是本次对话/ },
  { type: '系统消息', pattern: /^(.+?)邀请(.+?)加入了群聊/ },
  { type: '系统消息', pattern: /^(.+?)退出群聊/ },
  { type: '系统消息', pattern: /^(.+?)被(.+?)移出了群聊/ },
  { type: '系统消息', pattern: /^群聊的群主已更改为/ },
  { type: '系统消息', pattern: /^你被(.+?)移出群聊/ },
  { type: '系统消息', pattern: /^(.+?)拍了拍(.+?)$/ },
  { type: '系统消息', pattern: /^消息已发出，但被对方拒收了$/ },
  { type: '系统消息', pattern: /^(.+?)开启了好友验证/ },
  { type: '系统消息', pattern: /^现在可以开始聊天了$/ },
  { type: '系统消息', pattern: /^(.+?)设置(\S+)为群管理员/ },
  { type: '系统消息', pattern: /^(群公告|公告)/ },

  // === 红包 ===
  // 注意：只过滤系统生成的红包通知，不过滤用户说的"恭喜发财"等真人对话
  { type: '红包', pattern: /^你已领取了/ },
  { type: '红包', pattern: /^你(已|的).*红包/ },
  { type: '红包', pattern: /^收到红包/ },
  { type: '红包', pattern: /^(.+?)的红包/ },

  // === 转账 ===
  { type: '转账', pattern: /^转账|^已收款|^对方已收款|^转账收款/ },

  // === 图片/视频 ===
  { type: '图片', pattern: /^\[图片\]|^<图片>|^\[动画表情\]|^\[表情\]/ },
  { type: '视频', pattern: /^\[视频\]|^<视频>/ },

  // === 语音 ===
  { type: '语音', pattern: /^\[语音\]|^<语音>|^\[语音通话\]/ },

  // === 位置/名片 ===
  { type: '位置', pattern: /^\[位置\]|^<位置>|^\[定位\]/ },
  { type: '名片', pattern: /^\[名片\]|^<名片>|^推荐名片/ },

  // === 小程序/链接 ===
  { type: '小程序', pattern: /^\[小程序\]|^<小程序>|^\[小程序卡片\]/ },
  { type: '链接', pattern: /^\[链接\]|^<链接>/ },

  // === 文件 ===
  { type: '文件', pattern: /^\[文件\]|^<文件>/ },

  // === 引用回复（通常以 "> " 开头） ===
  { type: '引用', pattern: /^>.+/ },

  // === 纯空白消息 ===
  { type: '空白', pattern: /^\s*$/ },

  // === 日历/提醒 ===
  { type: '提醒', pattern: /^\[提醒\]|^<提醒>/ },

  // === 转账红包混合 ===
  { type: '转账', pattern: /^(\[转账\]|<转账>)/ },

  // === 群聊相关 ===
  { type: '群聊', pattern: /^"(.+?)" 通过扫描"(.+?)"分享的二维码加入群聊/ },
  { type: '群聊', pattern: /^(.+?)通过分享的二维码加入群聊/ },
]

/**
 * 检测单条消息是否需要过滤
 * 逐行检测：因为多行消息中某一行可能是系统消息（被追加到内容中）
 * @param {string} content
 * @returns {{ filtered: boolean, reason: string|null }}
 */
function shouldFilter(content) {
  if (!content || content.trim() === '') {
    return { filtered: true, reason: '空白' }
  }

  const trimmed = content.trim()

  // 整段匹配
  for (const rule of FILTER_RULES) {
    if (rule.pattern.test(trimmed)) {
      return { filtered: true, reason: rule.type }
    }
  }

  // 多行消息：逐行检查，任一行为系统消息则整条过滤
  const lines = trimmed.split('\n')
  if (lines.length > 1) {
    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue
      for (const rule of FILTER_RULES) {
        if (rule.pattern.test(trimmedLine)) {
          return { filtered: true, reason: `${rule.type}(多行)` }
        }
      }
    }
  }

  return { filtered: false, reason: null }
}

/**
 * 批量过滤消息列表
 * @param {Array} messages
 * @returns {{ filtered: Array, removed: Array, stats: { total: number, filtered: number, byType: Object } }}
 */
function filterMessages(messages) {
  const filtered = []
  const removed = []
  const byType = {}

  for (const msg of messages) {
    const result = shouldFilter(msg.content)
    if (result.filtered) {
      removed.push({ ...msg, filterReason: result.reason })
      byType[result.reason] = (byType[result.reason] || 0) + 1
    } else {
      filtered.push(msg)
    }
  }

  return {
    filtered,
    removed,
    stats: {
      total: messages.length,
      filtered: removed.length,
      byType
    }
  }
}

export {
  filterMessages,
  shouldFilter,
  FILTER_RULES
}
