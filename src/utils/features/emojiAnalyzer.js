/**
 * 表情分析器
 * 统计 emoji 使用频率、偏好类型
 *
 * 使用正则匹配 emoji（纯 JS，不依赖库）
 */

// Emoji Unicode 范围
const EMOJI_PATTERN = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{231A}-\u{23FF}\u{25AA}-\u{25FF}\u{2934}-\u{2935}\u{2B05}-\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu

// Emoji 分类（常见分类的简单判断）
const EMOJI_CATEGORIES = {
  // 表情/情感
  face: [
    '\u{1F600}', '\u{1F601}', '\u{1F602}', '\u{1F603}', '\u{1F604}',
    '\u{1F605}', '\u{1F606}', '\u{1F607}', '\u{1F608}', '\u{1F609}',
    '\u{1F60A}', '\u{1F60B}', '\u{1F60C}', '\u{1F60D}', '\u{1F60E}',
    '\u{1F60F}', '\u{1F610}', '\u{1F611}', '\u{1F612}', '\u{1F613}',
    '\u{1F614}', '\u{1F615}', '\u{1F616}', '\u{1F617}', '\u{1F618}',
    '\u{1F619}', '\u{1F61A}', '\u{1F61B}', '\u{1F61C}', '\u{1F61D}',
    '\u{1F61E}', '\u{1F61F}', '\u{1F620}', '\u{1F621}', '\u{1F622}',
    '\u{1F623}', '\u{1F624}', '\u{1F625}', '\u{1F626}', '\u{1F627}',
    '\u{1F628}', '\u{1F629}', '\u{1F62A}', '\u{1F62B}', '\u{1F62C}',
    '\u{1F62D}', '\u{1F62E}', '\u{1F62F}', '\u{1F630}', '\u{1F631}',
    '\u{1F632}', '\u{1F633}', '\u{1F634}', '\u{1F635}', '\u{1F636}',
    '\u{1F637}', '\u{1F638}', '\u{1F639}', '\u{1F63A}', '\u{1F63B}',
    '\u{1F63C}', '\u{1F63D}', '\u{1F63E}', '\u{1F63F}', '\u{1F640}',
    '\u{1F641}', '\u{1F642}', '\u{1F643}', '\u{1F644}', '\u{1F645}',
    '\u{1F646}', '\u{1F647}', '\u{1F648}', '\u{1F649}', '\u{1F64A}',
    '\u{1F64B}', '\u{1F64C}', '\u{1F64D}', '\u{1F64E}', '\u{1F64F}',
    '\u{263A}', '\u{2639}',
    // WeChat emoji shortcuts (text-based)
    '[微笑]', '[开心]', '[大笑]', '[高兴]', '[害羞]', '[脸红]',
    '[色]', '[可爱]', '[眨眼]', '[呲牙]', '[调皮]', '[调皮]',
    '[得意]', '[傲慢]', '[冷漠]', '[困]', '[睡觉]', '[晕]',
    '[尴尬]', '[囧]', '[疑惑]', '[撇嘴]', '[委屈]', '[流泪]',
    '[大哭]', '[恐惧]', '[惊恐]', '[心]', '[爱心]', '[玫瑰]',
    '[凋谢]', '[闪电]', '[炸弹]', '[菜刀]', '[便便]', '[月亮]',
    '[太阳]', '[礼物]', '[红包]', '[咖啡]', '[蛋糕]', '[啤酒]',
    '[强]', '[弱]', '[握手]', '[胜利]', '[抱拳]', '[勾引]',
    '[拳头]', '[OK]', '[合十]', '[耶]',
    // Common at symbol emojis
    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
    '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗',
    '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥',
    '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜',
    '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️',
    '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨',
    '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵',
    '😡', '😠', '🤬', '😇', '🥳', '🥺', '🤡', '🤠', '🤥', '🤫',
    '🤭', '🧐', '🤓', '😈'
  ],
  // 手/动作
  hand: [
    '\u{1F44A}', '\u{1F44B}', '\u{1F44C}', '\u{1F44D}', '\u{1F44E}',
    '\u{1F44F}', '\u{1F450}', '\u{1F64C}', '\u{1F64F}', '\u{1F91A}',
    '\u{1F91B}', '\u{1F91C}', '\u{1F91D}', '\u{1F91E}', '\u{1F91F}',
    '\u{1F918}', '\u{1F919}', '\u{270C}', '\u{270A}', '\u{270B}',
    '\u{261D}',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👋', '🤚',
    '✋', '👏', '🙌', '🤲', '🙏', '💪', '🖕',
    '[强]', '[弱]', '[握手]', '[胜利]', '[抱拳]', '[OK]', '[合十]'
  ],
  // 心/情感
  heart: [
    '\u{2764}', '\u{1F498}', '\u{1F49B}', '\u{1F49C}', '\u{1F49D}',
    '\u{1F49E}', '\u{1F49F}', '\u{1F5A4}', '\u{1F90D}', '\u{1F90E}',
    '\u{1F90F}', '\u{1F48B}',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕',
    '💞', '💗', '💖', '💘', '💝', '💟', '♥️',
    '[心]', '[爱心]', '[玫瑰]'
  ],
  // 自然/动物
  nature: [
    '\u{1F31F}', '\u{2600}', '\u{2601}', '\u{2614}', '\u{2744}',
    '\u{1F308}', '\u{1F30A}', '\u{1F30B}', '\u{1F30C}',
    '\u{1F31A}', '\u{1F31B}', '\u{1F31C}', '\u{1F31D}', '\u{1F31E}',
    '\u{1F400}-\u{1F4D3}',
    '🌞', '🌝', '🌚', '🌛', '🌜', '🌙', '⭐', '🌟', '✨',
    '☀️', '🌤', '⛅', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩',
    '🌨', '❄️', '☃️', '⛄', '🔥', '💧', '🌊',
    '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌿', '🍀',
    '🐱', '🐶', '🐰', '🐼', '🐻', '🦊', '🐸', '🐵', '🙈',
    '🙉', '🙊', '🐯', '🦁', '🦄', '🐴', '🐮', '🐷', '🐭',
    '🐹', '🐻‍❄️', '🐨', '🐲', '🐔', '🐧', '🐦', '🐤', '🐣',
    '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐛', '🦋', '🐌',
    '🐝', '🐞', '🦟', '🦗', '🪲', '🦂', '🐚', '🪸',
    '[太阳]', '[月亮]', '[闪电]'
  ],
  // 食物
  food: [
    '\u{1F32D}-\u{1F32F}', '\u{1F330}-\u{1F340}', '\u{1F342}-\u{1F344}',
    '\u{1F345}-\u{1F34A}', '\u{1F34B}-\u{1F352}', '\u{1F353}-\u{1F37F}',
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈',
    '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🥑', '🥦', '🥬',
    '🥒', '🌽', '🥕', '🧅', '🥔', '🍠', '🥐', '🍞', '🥖',
    '🧀', '🥚', '🍳', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖',
    '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯',
    '🥗', '🥘', '🍲', '🍜', '🍝', '🍣', '🍤', '🥟', '🍱',
    '🍛', '🍚', '🍙', '🍘', '🍢', '🍡', '🍧', '🍨', '🍦',
    '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭',
    '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🧃', '🥤', '🧊',
    '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹',
    '[咖啡]', '[蛋糕]', '[啤酒]', '[红包]', '[礼物]'
  ],
  // 活动/旅行
  activity: [
    '\u{26BD}', '\u{26BE}', '\u{1F3C0}', '\u{1F3C8}', '\u{1F3D0}',
    '\u{1F3B5}', '\u{1F3B6}', '\u{1F3A8}', '\u{1F3AC}',
    '\u{1F3AE}', '\u{1F30D}', '\u{2708}',
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏',
    '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃',
    '⛳', '🥊', '🥋', '🎽', '⛷', '🏂', '🪂', '🏋️', '🤼',
    '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄',
    '🚴', '🚵', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼',
    '🎹', '🥁', '🪘', '🎷', '🎺', '🎸', '🪕', '🎻',
    '🎲', '♟️', '🎯', '🎳', '🎮', '🕹️',
    '✈️', '🚂', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️',
    '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🏍️', '🛵',
    '🛺', '🚲', '🛴', '🛹', '🚨', '🚔', '🚍', '🚘', '🚖',
    '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅',
    '🚈', '🚇', '🚊', '🚉', '🗺️', '⛰️', '🏔️', '🌋',
    '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️',
    '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡',
    '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫',
    '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽',
    // WeChat
    '[跳跳]', '[发抖]', '[怄火]', '[转圈]'
  ]
}

// 合并所有分类中的 emoji 用于检测
const ALL_KNOWN = new Set()
for (const cat of Object.values(EMOJI_CATEGORIES)) {
  for (const e of cat) {
    ALL_KNOWN.add(e)
  }
}

/**
 * 从文本中提取所有 emoji
 * @param {string} text
 * @returns {string[]}
 */
function extractEmojis(text) {
  if (!text) return []

  const results = []

  // 1. Unicode emoji
  const unicodeMatches = text.match(EMOJI_PATTERN)
  if (unicodeMatches) {
    results.push(...unicodeMatches)
  }

  // 2. WeChat 文字表情 [xxx]
  const wechatMatches = text.match(/\[[\u4e00-\u9fff\w]+\]/g)
  if (wechatMatches) {
    for (const wm of wechatMatches) {
      if (ALL_KNOWN.has(wm)) {
        results.push(wm)
      }
    }
  }

  // 3. 常见 Unicode emoji 单字符（补充 EMOJI_PATTERN 可能遗漏的）
  const commonEmojiMatches = text.match(/[☀️⭐🔥❤️💕💗✨⭐🌟💪👍👎👌✌️👏🙌🙏🎉🎊🎈💯✅❌❗❓💡💰🔑🔒🔓🛡️🎯🧩🎨🎵🎶🔔📢📣💬🗨️👀🦠🧬🔬🔭🧪🧫📊📈📉🗂️📁📂🗃️📐📏🔗⛓️🧩🎁🕯️🧸🪴🧭⏳⌛⏰⌚️🔋🔌💻🖥️⌨️🖱️🖨️📠📟📞📱💻🎥📽️📺📷📸📹📼🔍🔎🔮💣🧨🪓🔧🔨⚒️🛠️⛏️🔩⚙️🧰🧲⚗️🧪🧫💉🩸💊🩹🩺🌡️🧹🧺🪣🧴🧻🪒🧹🧷🧯🛒🎃🎄🎆🎇✨🎉🎊🎈🎁🎀🪄🎠🎡🎢💎🧿🎐🪅🪆🧩🎮🕹️🎲♟️🧸🪀🪁🧩🎯🧿🪬🗿🎭🎨🧵🪡🧶🪢👑👒🎩🎓🧢⛑️👓🕶️🥽🥼🦺👔👕👖🧣🧤🧥🧦👗👘🥻🩱🩲🩳👙👚👛👜👝🛍️🎒👞👟🥿👠👡👢👑👒🎩🎓🧢⛑️💄💍💎🌂🧳☂️]/
  )

  return results
}

/**
 * 分析 emoji 使用特征
 * @param {string[]} messages - 目标说话人的所有消息
 * @returns {Object}
 */
function analyze(messages) {
  if (!messages || messages.length === 0) {
    return {
      totalMessages: 0,
      totalEmojis: 0,
      messagesWithEmoji: 0,
      emojiPerMessage: '0.00',
      topEmojis: [],
      categoryBreakdown: {},
      overallStyle: '未使用表情'
    }
  }

  const allText = messages.join('\n')
  const allEmojis = extractEmojis(allText)

  // 统计 emoji 频率
  const freqMap = {}
  for (const emoji of allEmojis) {
    freqMap[emoji] = (freqMap[emoji] || 0) + 1
  }

  // 含 emoji 的消息数
  let messagesWithEmoji = 0
  for (const msg of messages) {
    const emojis = extractEmojis(msg)
    if (emojis.length > 0) messagesWithEmoji++
  }

  // 分类统计
  const categoryBreakdown = {}
  for (const [cat, emojis] of Object.entries(EMOJI_CATEGORIES)) {
    let count = 0
    for (const e of emojis) {
      count += freqMap[e] || 0
    }
    if (count > 0) {
      categoryBreakdown[cat] = count
    }
  }

  // Top emoji
  const topEmojis = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([emoji, count]) => ({ emoji, count }))

  // 总体风格描述
  const totalEmojis = allEmojis.length
  const emojiPerMsg = messages.length > 0 ? totalEmojis / messages.length : 0
  const emojiMsgRatio = messages.length > 0 ? messagesWithEmoji / messages.length : 0

  let overallStyle
  if (totalEmojis === 0) {
    overallStyle = '不使用表情'
  } else if (emojiPerMsg > 2) {
    overallStyle = '表情达人'
  } else if (emojiPerMsg > 1) {
    overallStyle = '爱用表情'
  } else if (emojiMsgRatio > 0.5) {
    overallStyle = '偶尔用表情'
  } else {
    overallStyle = '很少用表情'
  }

  return {
    totalMessages: messages.length,
    totalEmojis,
    messagesWithEmoji,
    emojiPerMessage: emojiPerMsg.toFixed(2),
    emojiMessageRatio: parseFloat(emojiMsgRatio.toFixed(2)),
    topEmojis,
    categoryBreakdown,
    overallStyle,
    confidence: messages.length >= 10 ? 'high' : messages.length >= 5 ? 'medium' : 'low'
  }
}

export {
  analyze,
  extractEmojis
}
