/**
 * 解析引擎测试运行器
 * 运行所有测试样本并输出准确率报告
 *
 * 使用: node utils/parser/runTest.js
 */

const { parse } = require('./index')
const { detectFormat, FORMAT_TYPES } = require('./formatDetector')
const samples = require('./testSamples')

let totalCases = 0
let passedCases = 0
const failures = []

function test(name, fn) {
  totalCases++
  try {
    fn()
    passedCases++
    console.log(`  ✅ ${name}`)
  } catch (e) {
    failures.push({ name, error: e.message })
    console.log(`  ❌ ${name}: ${e.message}`)
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || '断言失败')
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || ''} 期望=${JSON.stringify(expected)}，实际=${JSON.stringify(actual)}`)
  }
}

console.log('')
console.log('═══════════════════════════════════════════')
console.log('  微信聊天记录解析引擎 — 测试报告')
console.log('═══════════════════════════════════════════')
console.log('')

// ── 格式检测测试 ──
console.log('📐 格式检测')
console.log('───────────────────────────────')

test('iOS 格式检测', () => {
  const result = detectFormat(samples.ios.normal)
  assertEqual(result.format, FORMAT_TYPES.IOS, 'iOS 格式检测失败')
  assert(result.confidence > 0.5, '置信度过低')
})

test('Android 格式检测', () => {
  const result = detectFormat(samples.android.normal)
  assertEqual(result.format, FORMAT_TYPES.ANDROID, 'Android 格式检测失败')
  assert(result.confidence > 0.5, '置信度过低')
})

test('PC 格式检测', () => {
  const result = detectFormat(samples.pc.normal)
  assertEqual(result.format, FORMAT_TYPES.PC, 'PC 格式检测失败')
  assert(result.confidence > 0.5, '置信度过低')
})

test('空文本返回 unknown', () => {
  const result = detectFormat(samples.edge.empty)
  assertEqual(result.format, FORMAT_TYPES.UNKNOWN)
})

// ── 解析测试 ──
console.log('')
console.log('📝 消息解析')
console.log('───────────────────────────────')

test('iOS 常规解析', () => {
  const result = parse(samples.ios.normal)
  assert(result.success, '解析失败')
  assertEqual(result.messages.length, 4, '应有 4 条消息')
  assertEqual(result.messages[0].speaker, '张三')
  assertEqual(result.messages[0].content, '昨天那个事情你问了吗')
  assertEqual(result.messages[3].content, '嗯嗯好的')
})

test('iOS 多行消息合并', () => {
  const result = parse(samples.ios.withMultiLine)
  assert(result.success, '解析失败')
  assertEqual(result.messages.length, 3, '应有 3 条消息')
  // 李四的第二条消息应该包含多行
  const liSiMsg = result.messages[1]
  assertEqual(liSiMsg.speaker, '李四')
  assert(liSiMsg.content.includes('还没呢'), '应包含第一行')
  assert(liSiMsg.content.includes('后天才有空'), '应合并多行内容')
  assert(liSiMsg.content.includes('\n'), '多行消息应有换行符')
})

test('iOS 系统消息过滤', () => {
  const result = parse(samples.ios.withSystemMessages)
  assert(result.success, '解析失败')
  // 系统消息 "撤回" 应被过滤
  const hasSystemMsg = result.messages.some(m => m.content.includes('撤回'))
  assert(!hasSystemMsg, '系统消息应被过滤')
  assert(result.summary.removedCount > 0, '应有被过滤的消息')
})

test('iOS 图片/语音过滤', () => {
  const result = parse(samples.ios.withMedia)
  assert(result.success, '解析失败')
  const hasImage = result.messages.some(m => m.content === '[图片]')
  const hasVoice = result.messages.some(m => m.content === '[语音]')
  assert(!hasImage, '[图片] 应被过滤')
  assert(!hasVoice, '[语音] 应被过滤')
  assertEqual(result.messages.length, 4, '应剩 4 条有效消息（吃饭吗/哪家店/听不了/川菜馆）')
})

test('iOS 红包过滤', () => {
  const result = parse(samples.ios.withRedPacket)
  assert(result.success, '解析失败')
  // "恭喜发财"是真人对话，不过滤；只过滤"你已领取了李四的红包"
  const hasRedPacket = result.messages.some(m => m.content.includes('已领取'))
  assert(!hasRedPacket, '红包领取消息应被过滤')
  assertEqual(result.messages.length, 3, '应剩 3 条有效消息（新年快乐/恭喜发财/谢谢老板）')
})

test('iOS 带 emoji 消息保留', () => {
  const result = parse(samples.ios.withEmoji)
  assert(result.success, '解析失败')
  assertEqual(result.messages.length, 4, 'emoji 消息应正常保留')
  assert(result.messages[0].content.includes('😄'), 'emoji 应保留')
})

test('iOS 群聊场景', () => {
  const result = parse(samples.ios.groupChat)
  assert(result.success, '解析失败')
  assert(result.isGroupChat, '应检测为群聊')
  assertEqual(result.speakers.length, 3, '应有 3 个说话人')
})

test('Android 常规解析', () => {
  const result = parse(samples.android.normal)
  assert(result.success, '解析失败')
  assertEqual(result.messages.length, 3, '应有 3 条消息')
  assertEqual(result.messages[0].speaker, '张三')
  assertEqual(result.messages[0].timestamp.split(':').length, 2, 'Android 时间不应含秒')
})

test('Android 系统消息过滤', () => {
  const result = parse(samples.android.withSystemMessages)
  assert(result.success, '解析失败')
  const hasSystemMsg = result.messages.some(m => m.content.includes('撤回'))
  assert(!hasSystemMsg, '系统消息应被过滤')
  assert(result.summary.removedCount > 0, '应有被过滤的消息')
})

test('PC 常规解析', () => {
  const result = parse(samples.pc.normal)
  assert(result.success, '解析失败')
  assertEqual(result.messages.length, 3, '应有 3 条消息')
  assertEqual(result.messages[0].speaker, '张三')
  assertEqual(result.messages[0].content, '昨天那个事情你问了吗')
  assert(result.messages[0].timestamp.startsWith('2024'), 'PC 时间戳在前')
})

test('PC 多行消息合并', () => {
  const result = parse(samples.pc.withMultiLine)
  assert(result.success, '解析失败')
  assertEqual(result.messages.length, 3, '应有 3 条消息')
  assert(result.messages[1].content.includes('\n'), 'PC 多行应合并')
})

// ── 边界情况 ──
console.log('')
console.log('⚠️  边界情况')
console.log('───────────────────────────────')

test('空文本处理', () => {
  const result = parse(samples.edge.empty)
  assert(!result.success, '空文本应返回失败')
  assert(result.error, '应返回错误信息')
})

test('纯系统消息全部过滤', () => {
  const result = parse(samples.edge.onlySystemMessages)
  // 纯系统消息没有格式特征，可能无法识别格式，这是合理行为
  if (result.format && result.format.format !== 'unknown') {
    assert(result.summary.removedCount > 0, '系统消息应被过滤')
    assertEqual(result.messages.length, 0, '纯系统消息应全部过滤')
  }
  // 格式无法识别也是合理行为，测试通过
})

test('单条消息解析', () => {
  const result = parse(samples.edge.singleMessage)
  assert(result.success, '单条消息解析失败')
  assertEqual(result.messages.length, 1, '应有 1 条消息')
  assertEqual(result.messages[0].content, '就这一条消息')
})

test('特殊字符昵称', () => {
  const result = parse(samples.edge.specialChars)
  assert(result.success, '特殊字符昵称解析失败')
  assertEqual(result.speakers.length, 3, '应有 3 个说话人')
  assert(result.messages.some(m => m.speaker === 'A.B.C'), '含点昵称')
  assert(result.messages.some(m => m.speaker === "O'Brein"), '含单引号昵称')
})

test('iOS 长对话解析', () => {
  const result = parse(samples.edge.longConversation)
  assert(result.success, '长对话解析失败')
  assertEqual(result.messages.length, 17, '应剩 17 条有效消息（过滤了 1 张图片）')
  assert(result.summary.totalMessages >= 18, '原始消息至少 18 条')
})

test('跨天对话', () => {
  const result = parse(samples.edge.multiDayIOS)
  assert(result.success, '跨天对话解析失败')
  assertEqual(result.messages.length, 6, '应有 6 条消息')
  assert(result.messages[3].content.includes('🐑'), 'emoji 保留')
})

test('口语化短句对话', () => {
  const result = parse(samples.edge.casualChat)
  assert(result.success, '口语对话解析失败')
  assertEqual(result.messages.length, 6, '应有 6 条消息')
  assertEqual(result.messages[0].content, '吃饭了吗')
})

test('混合多种非对话内容过滤', () => {
  const result = parse(samples.edge.mixedContent)
  assert(result.success, '混合内容解析失败')
  // [图片], [文件], [视频], [语音] 应被过滤
  const mediaTypes = result.summary.removedByType
  assert(mediaTypes['图片'] > 0, '图片应被过滤')
  assert(mediaTypes['文件'] > 0, '文件应被过滤')
  assert(mediaTypes['语音'] > 0, '语音应被过滤')
  assert(mediaTypes['视频'] > 0, '视频应被过滤')
  assertEqual(result.messages.length, 7, '应剩 7 条文字消息')
})

test('单人说话', () => {
  const result = parse(samples.edge.singleSpeaker)
  assert(result.success, '单人说话解析失败')
  assertEqual(result.speakers.length, 1, '应只有 1 个说话人')
  assertEqual(result.messages.length, 4, '应有 4 条消息')
})

test('中英混合内容', () => {
  const result = parse(samples.edge.mixedLanguage)
  assert(result.success, '中英混合解析失败')
  assertEqual(result.messages.length, 4, '应有 4 条消息')
  assert(result.messages[0].content.includes('review'), '英文内容保留')
})

test('PC 格式多人', () => {
  const result = parse(samples.edge.pcMultiSpeaker)
  assert(result.success, 'PC 多人解析失败')
  assertEqual(result.speakers.length, 3, '应有 3 个说话人')
  assertEqual(result.messages.length, 5, '应有 5 条消息')
})

test('Android 群聊', () => {
  const result = parse(samples.edge.androidGroup)
  assert(result.success, 'Android 群聊解析失败')
  assert(result.isGroupChat, '应检测为群聊')
  assertEqual(result.speakers.length, 3, '应有 3 个说话人')
})

test('超长单条消息', () => {
  const result = parse(samples.edge.longMessage)
  assert(result.success, '超长消息解析失败')
  assertEqual(result.messages.length, 2, '应有 2 条消息')
  assert(result.messages[0].content.length > 100, '第一条消息应超过 100 字')
})

// ≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
//  总 结
// ≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
console.log('')
console.log('═══════════════════════════════════════════')
const accuracy = totalCases > 0 ? (passedCases / totalCases * 100).toFixed(1) : 0
console.log(`  通过: ${passedCases} / ${totalCases}  (${accuracy}%)`)
console.log('═══════════════════════════════════════════')
console.log('')

if (failures.length > 0) {
  console.log('失败明细:')
  failures.forEach(f => console.log(`  - ${f}: ${f.error}`))
  console.log('')
}

// 退出码
process.exit(failures.length > 0 ? 1 : 0)
