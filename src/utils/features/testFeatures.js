/**
 * 风格特征提取模块 — 测试运行器
 *
 * 使用: node utils/features/testFeatures.js
 */

const { generate, getSpeakerMessages } = require('./index')
const wordFreq = require('./wordFrequency')
const phraseExt = require('./phraseExtractor')
const toneAna = require('./toneAnalyzer')
const emojiAna = require('./emojiAnalyzer')
const lenAna = require('./lengthAnalyzer')

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

// ─── 模拟聊天数据 ───
const sampleMessages = [
  // 张三（目标说话人）— 话多、爱用表情、口语化
  { speaker: '张三', content: '哈哈好的吧😄', timestamp: '2024/1/15 14:30:22', lineNumber: 1 },
  { speaker: '李四', content: '嗯嗯', timestamp: '2024/1/15 14:31:05', lineNumber: 2 },
  { speaker: '李四', content: '那明天几点', timestamp: '2024/1/15 14:31:10', lineNumber: 3 },
  { speaker: '张三', content: '我觉得明天下午三点怎么样', timestamp: '2024/1/15 14:32:18', lineNumber: 4 },
  { speaker: '张三', content: '你觉得呢🤔', timestamp: '2024/1/15 14:32:20', lineNumber: 5 },
  { speaker: '李四', content: '行，可以', timestamp: '2024/1/15 14:33:00', lineNumber: 6 },
  { speaker: '张三', content: '那就这么说定了！到时候我叫你', timestamp: '2024/1/15 14:34:00', lineNumber: 7 },
  { speaker: '张三', content: '别迟到哦😅', timestamp: '2024/1/15 14:34:10', lineNumber: 8 },
  { speaker: '李四', content: '知道了知道了', timestamp: '2024/1/15 14:35:00', lineNumber: 9 },
  { speaker: '张三', content: '好吧好吧，我相信你😂', timestamp: '2024/1/15 14:36:00', lineNumber: 10 },
  { speaker: '张三', content: '对了，要不要叫上王五一起？', timestamp: '2024/1/15 14:37:00', lineNumber: 11 },
  { speaker: '李四', content: '可以啊，你去叫他', timestamp: '2024/1/15 14:38:00', lineNumber: 12 },
  { speaker: '张三', content: '行，我跟他说', timestamp: '2024/1/15 14:39:00', lineNumber: 13 },
]

// 话少的对手（李四）
const shortSpeakerMessages = [
  { speaker: '王五', content: '嗯', timestamp: '2024/1/15 14:30:00', lineNumber: 1 },
  { speaker: '王五', content: '好', timestamp: '2024/1/15 14:31:00', lineNumber: 2 },
  { speaker: '王五', content: '行吧', timestamp: '2024/1/15 14:32:00', lineNumber: 3 },
  { speaker: '王五', content: '哦哦', timestamp: '2024/1/15 14:33:00', lineNumber: 4 },
  { speaker: '王五', content: '知道了', timestamp: '2024/1/15 14:34:00', lineNumber: 5 },
  { speaker: '王五', content: '好的', timestamp: '2024/1/15 14:35:00', lineNumber: 6 },
]

// 爱提问的话唠（赵六）
const questionSpeakerMessages = [
  { speaker: '赵六', content: '你觉得这个怎么样？', timestamp: '2024/1/15 14:30:00', lineNumber: 1 },
  { speaker: '赵六', content: '真的吗？？？', timestamp: '2024/1/15 14:31:00', lineNumber: 2 },
  { speaker: '赵六', content: '为什么啊？我觉得挺好的啊！', timestamp: '2024/1/15 14:32:00', lineNumber: 3 },
  { speaker: '赵六', content: '那怎么办？还有别的办法吗？', timestamp: '2024/1/15 14:33:00', lineNumber: 4 },
  { speaker: '赵六', content: '不会吧？？😱', timestamp: '2024/1/15 14:34:00', lineNumber: 5 },
  { speaker: '赵六', content: '然后呢然后呢？', timestamp: '2024/1/15 14:35:00', lineNumber: 6 },
  { speaker: '赵六', content: '然后我就跟他说了，然后他就同意了', timestamp: '2024/1/15 14:35:30', lineNumber: 7 },
  { speaker: '赵六', content: '然后呢，后来怎么样了', timestamp: '2024/1/15 14:35:45', lineNumber: 8 },
  { speaker: '赵六', content: '好吧……那算了', timestamp: '2024/1/15 14:36:00', lineNumber: 8 },
  { speaker: '赵六', content: '等等，我还没说完呢！', timestamp: '2024/1/15 14:37:00', lineNumber: 9 },
  { speaker: '赵六', content: '你说的对哈，我没想到这一点', timestamp: '2024/1/15 14:38:00', lineNumber: 10 },
  { speaker: '赵六', content: '那我能问一下，什么时候能搞定？', timestamp: '2024/1/15 14:39:00', lineNumber: 11 },
]

// Emoji 狂魔（钱七）
const emojiSpeakerMessages = [
  { speaker: '钱七', content: '今天天气真好😄☀️🌞', timestamp: '2024/1/15 14:30:00', lineNumber: 1 },
  { speaker: '钱七', content: '一起出来玩吧🎉🎉🎉', timestamp: '2024/1/15 14:31:00', lineNumber: 2 },
  { speaker: '钱七', content: '好的好的👍👍', timestamp: '2024/1/15 14:32:00', lineNumber: 3 },
  { speaker: '钱七', content: '太开心了🥰❤️💕', timestamp: '2024/1/15 14:33:00', lineNumber: 4 },
  { speaker: '钱七', content: '爱你哟😘😘😘', timestamp: '2024/1/15 14:34:00', lineNumber: 5 },
  { speaker: '钱七', content: '那说好了哦🤝', timestamp: '2024/1/15 14:35:00', lineNumber: 6 },
]

console.log('')
console.log('═══════════════════════════════════════════')
console.log('  风格特征提取模块 — 测试报告')
console.log('═══════════════════════════════════════════')
console.log('')

// ── 基础功能测试 ──
console.log('📐 基础功能')
console.log('───────────────────────────────')

test('getSpeakerMessages 正确提取', () => {
  const msgs = getSpeakerMessages(sampleMessages, '张三')
  assertEqual(msgs.length, 8, '张三应有 8 条消息')
  assert(msgs.every(m => typeof m === 'string'), '应返回字符串数组')
})

test('getSpeakerMessages 不存在的人返回空数组', () => {
  const msgs = getSpeakerMessages(sampleMessages, '不存在')
  assertEqual(msgs.length, 0, '应返回空数组')
})

// ── 词频统计 ──
console.log('')
console.log('📝 词频统计')
console.log('───────────────────────────────')

test('wordFrequency 正常统计', () => {
  const msgs = getSpeakerMessages(sampleMessages, '张三')
  const result = wordFreq.analyze(msgs)
  assert(result.totalMessages > 0, '应有消息')
  assert(result.topWords.length > 0, '应有高频字')
  assert(result.topBigrams.length > 0, '应有高频词')
})

test('wordFrequency 空输入', () => {
  const result = wordFreq.analyze([])
  assertEqual(result.totalMessages, 0)
})

// ── 口头禅提取 ──
console.log('')
console.log('🗣️  口头禅提取')
console.log('───────────────────────────────')

test('phraseExtractor 识别句式开头', () => {
  const msgs = getSpeakerMessages(sampleMessages, '张三')
  const result = phraseExt.analyze(msgs)
  assert(result.commonStarters.length > 0, '应有句式开头分析')
})

test('phraseExtractor 检测口头禅', () => {
  const msgs = getSpeakerMessages(questionSpeakerMessages, '赵六')
  const result = phraseExt.analyze(msgs)
  assert(result.detectedCatchphrases.length > 0, '赵六应有口头禅')
  const hasThen = result.detectedCatchphrases.some(p => p.phrase.includes('然后'))
  assert(hasThen, '应检测到"然后"')
})

// ── 语气分析 ──
console.log('')
console.log('🎭 语气分析')
console.log('───────────────────────────────')

test('toneAnalyzer 分析语气词', () => {
  const msgs = getSpeakerMessages(sampleMessages, '张三')
  const result = toneAna.analyze(msgs)
  assert(result.modalParticleStats.total > 0, '应有语气词')
})

test('toneAnalyzer 爱提问者检测', () => {
  const msgs = getSpeakerMessages(questionSpeakerMessages, '赵六')
  const result = toneAna.analyze(msgs)

  // 赵六用了很多问号和"吗"
  assertEqual(result.totalMessages, 12, '赵六应有 12 条消息')
  assert(result.overallTone.includes('提问') || result.overallTone.includes('好奇'),
    '赵六应被识别为爱提问')
  assert(result.colloquialScore > 0.5, '赵六说话偏口语化')
})

test('toneAnalyzer 标点分析', () => {
  const msgs = getSpeakerMessages(questionSpeakerMessages, '赵六')
  const result = toneAna.analyze(msgs)
  assert(parseFloat(result.punctuationStats.questionMark.perMessage) > 0.3,
    '赵六问号使用频繁')
  assert(parseFloat(result.punctuationStats.repeatedPunctuation.perMessage) > 0 ||
    result.punctuationStats.repeatedPunctuation.count > 0,
    '应检测到重复标点(？？)')
})

// ── 表情分析 ──
console.log('')
console.log('😊 表情分析')
console.log('───────────────────────────────')

test('emojiAnalyzer 提取 emoji', () => {
  const msgs = getSpeakerMessages(sampleMessages, '张三')
  const result = emojiAna.analyze(msgs)
  assert(result.totalEmojis > 0, '张三使用了 emoji')
})

test('emojiAnalyzer emoji 狂魔检测', () => {
  const msgs = getSpeakerMessages(emojiSpeakerMessages, '钱七')
  const result = emojiAna.analyze(msgs)
  assert(result.totalEmojis >= 10, '钱七应使用大量 emoji')
  assert(result.overallStyle === '表情达人', '应被识别为表情达人')
  assert(Object.keys(result.categoryBreakdown).length > 0, '应有分类统计')
})

// ── 回复长度分析 ──
console.log('')
console.log('📏 回复长度')
console.log('───────────────────────────────')

test('lengthAnalyzer 长度统计', () => {
  const msgs = getSpeakerMessages(sampleMessages, '张三')
  const result = lenAna.analyze(msgs)
  assert(result.averageLength > 0, '平均长度应 > 0')
  assert(result.minLength <= result.maxLength, '最小 <= 最大')
  assert(result.totalMessages === 8, '张三应有 8 条消息')
  assert(result.medianLength > 0, '有中位数')
})

test('lengthAnalyzer 极简短回复', () => {
  const msgs = getSpeakerMessages(shortSpeakerMessages, '王五')
  const result = lenAna.analyze(msgs)
  assert(result.averageLength <= 5, '王五回复极简')
  assert(result.lengthLevel.includes('极简'), '应识别为极简')
})

test('lengthAnalyzer 分布统计', () => {
  const msgs = getSpeakerMessages(sampleMessages, '张三')
  const result = lenAna.analyze(msgs)
  assert(Object.keys(result.distributionPct).length > 0, '应有分布百分比')
})

// ── 综合报告测试 ──
console.log('')
console.log('📊 综合风格报告')
console.log('───────────────────────────────')

test('generate 完整报告', () => {
  const result = generate(sampleMessages, '张三')
  assert(result.success, '生成成功')
  assertEqual(result.targetSpeaker, '张三')
  assert(result.report !== null, '有报告数据')
  assert(result.summary.length > 50, '风格描述文本应有足够长度')
})

test('generate 报告包含所有维度', () => {
  const result = generate(sampleMessages, '张三')
  const r = result.report
  assert(r.vocabulary !== undefined, '有词汇分析')
  assert(r.catchphrases !== undefined, '有口头禅')
  assert(r.tone !== undefined, '有语气')
  assert(r.emoji !== undefined, '有表情')
  assert(r.messageLength !== undefined, '有长度')
})

test('generate 消息不足时返回错误', () => {
  const result = generate(sampleMessages.slice(0, 1), '张三')
  assert(!result.success, '应返回失败')
  assert(result.error, '应有错误信息')
})

test('generate 空消息列表', () => {
  const result = generate([], '张三')
  assert(!result.success, '应返回失败')
})

test('generate 风格描述文本可读性', () => {
  const result = generate(sampleMessages, '张三')
  const summary = result.summary
  // 包含关键信息
  assert(summary.includes('张三'), '包含说话人名字')
  assert(summary.includes('回复长度') || summary.includes('语气') || summary.includes('高频'),
    '包含分析维度')
})

test('generate 不同说话人产生不同结果', () => {
  const r1 = generate(sampleMessages, '张三')
  const r2 = generate(questionSpeakerMessages, '赵六')
  assert(r1.summary !== r2.summary, '不同人的报告应不同')
  assert(r1.report.messageLength.lengthLevel !== r2.report.messageLength.lengthLevel ||
    r1.report.tone.overallTone !== r2.report.tone.overallTone,
    '长度或语气维度应有差异')
})

// ── 边缘情况 ──
console.log('')
console.log('⚠️  边缘情况')
console.log('───────────────────────────────')

test('空输入所有分析器', () => {
  assertEqual(wordFreq.analyze([]).totalMessages, 0, 'wordFrequency 空')
  assertEqual(phraseExt.analyze([]).totalMessages, 0, 'phraseExtractor 空')
})

test('单条消息所有分析器不崩溃', () => {
  const single = getSpeakerMessages(sampleMessages.slice(0, 1), '张三')
  wordFreq.analyze(single)
  phraseExt.analyze(single)
  // 如果 single 是空（张三不是第一条），用空数组
  const empty = []
  const wf = wordFreq.analyze(empty)
  assertEqual(wf.totalMessages, 0)
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
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`))
  console.log('')
}

process.exit(failures.length > 0 ? 1 : 0)
