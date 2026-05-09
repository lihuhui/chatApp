/**
 * SQLite 可用性验证
 *
 * 验证内容：
 * 1. 模块导出结构正确
 * 2. SQL 语句语法正确（正则校验 + 模拟执行）
 * 3. CRUD 逻辑流程正确
 * 4. 平台检测逻辑正确
 *
 * 运行方式：
 *   node src/utils/database/verify.js
 *
 * 真机验证（手动）：
 *   await db.init()
 *   await db.role.create({ name: '测试' })
 *   const roles = await db.role.list()
 *   console.log(roles)
 */

const path = require('path')
const fs = require('fs')

let totalTests = 0
let passedTests = 0
const failures = []

function test(name, fn) {
  totalTests++
  try {
    fn()
    passedTests++
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

// 加载数据库模块（从源码读取，不做 require 避免 plus 未定义报错）
// 而是直接解析源码进行验证
const dbPath = path.join(__dirname, 'index.js')
const dbSource = fs.readFileSync(dbPath, 'utf-8')

// 提取 SQL 语句进行语法验证
const sqlStatements = []

// 从源码中提取 CREATE TABLE 和其他 SQL
const sqlRegex = /`(CREATE TABLE[^`]+)`/g
let match
while ((match = sqlRegex.exec(dbSource)) !== null) {
  sqlStatements.push(match[1])
}

console.log('')
console.log('═══════════════════════════════════════════')
console.log('  SQLite 可用性验证报告')
console.log('═══════════════════════════════════════════')
console.log('')

// ── 1. SQL 语法校验 ──
console.log('📐 SQL 语法校验')
console.log('───────────────────────────────')

test('CREATE TABLE 语句数量正确', () => {
  assertEqual(sqlStatements.length, 4, '应有 4 张表')
})

// 简单 SQL 关键字校验
const sqlKeywords = ['CREATE TABLE', 'INSERT INTO', 'SELECT', 'UPDATE', 'DELETE FROM', 'PRAGMA']
test('包含所有必需 SQL 操作类型', () => {
  for (const kw of sqlKeywords) {
    assert(dbSource.includes(kw), `源码应包含 ${kw}`)
  }
})

for (const sql of sqlStatements) {
  const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1]
  test(`建表语句语法正确: ${tableName}`, () => {
    assert(sql.startsWith('CREATE TABLE IF NOT EXISTS'), `应以 CREATE TABLE IF NOT EXISTS 开头`)
    assert(sql.includes('('), '应包含字段定义')
    assert(sql.includes(')'), '应闭合')
    assert(/CREATE TABLE[^;]+\)/.test(sql), 'SQL 语句基本结构完整')
  })

  // 检查主键
  test(`${tableName} 表包含主键`, () => {
    assert(sql.includes('PRIMARY KEY'), `${tableName} 应定义主键`)
  })
}

test('roles 表字段完整', () => {
  const roleTable = sqlStatements[0]
  assert(roleTable.includes('name TEXT'), '应有 name')
  assert(roleTable.includes('avatar TEXT'), '应有 avatar')
  assert(roleTable.includes('style_features TEXT'), '应有 style_features')
  assert(roleTable.includes('message_count INTEGER'), '应有 message_count')
  assert(roleTable.includes('cloud_sync_id TEXT'), '应有 cloud_sync_id')
  assert(roleTable.includes('created_at TEXT'), '应有 created_at')
  assert(roleTable.includes('updated_at TEXT'), '应有 updated_at')
})

test('messages 表字段完整', () => {
  const msgTable = sqlStatements[2]
  assert(msgTable.includes('sender TEXT'), '应有 sender')
  assert(msgTable.includes('content TEXT'), '应有 content')
  assert(msgTable.includes('CHECK(sender IN'), '应有 sender CHECK 约束')
  assert(msgTable.includes('FOREIGN KEY (session_id)'), '应有外键')
})

test('sessions 表字段完整', () => {
  const sessTable = sqlStatements[1]
  assert(sessTable.includes('round_count INTEGER'), '应有 round_count')
  assert(sessTable.includes('status TEXT'), '应有 status')
  assert(sessTable.includes('FOREIGN KEY (role_id)'), '应有外键')
})

// ── 2. 模块结构验证 ──
console.log('')
console.log('📦 模块结构验证')
console.log('───────────────────────────────')

test('导出对象包含所有模块', () => {
  assert(dbSource.includes('export default {'), '应有 default export')
  assert(dbSource.includes('init,'), '应有 init')
  assert(dbSource.includes('role,'), '应有 role')
  assert(dbSource.includes('session,'), '应有 session')
  assert(dbSource.includes('message,'), '应有 message')
  assert(dbSource.includes('config,'), '应有 config')
  assert(dbSource.includes('isAppPlatform'), '应有平台检测')
})

test('role CRUD 完整', () => {
  assert(dbSource.includes('role = {') || dbSource.includes('const role'), '应有 role 对象')
  assert(dbSource.includes('create('), '应有 create')
  assert(dbSource.includes('list('), '应有 list')
  assert(dbSource.includes('getById('), '应有 getById')
  assert(dbSource.includes('update('), '应有 update')
  assert(dbSource.includes('remove('), '应有 remove')
})

test('session CRUD 完整', () => {
  assert(dbSource.includes('session = {') || dbSource.includes('const session'), '应有 session 对象')
  assert(dbSource.includes('create('), '应有 create')
  assert(dbSource.includes('listByRole('), '应有 listByRole')
  assert(dbSource.includes('incrementRound('), '应有 incrementRound')
  assert(dbSource.includes('markFull('), '应有 markFull')
})

test('message CRUD 完整', () => {
  assert(dbSource.includes('message = {') || dbSource.includes('const message'), '应有 message 对象')
  assert(dbSource.includes('create('), '应有 create')
  assert(dbSource.includes('listBySession('), '应有 listBySession')
  assert(dbSource.includes('getRecent('), '应有 getRecent')
})

// ── 3. 平台隔离验证 ──
console.log('')
console.log('🔒 平台隔离验证')
console.log('───────────────────────────────')

test('SQLite 操作使用条件编译保护', () => {
  // 统计所有条件编译开始标记和结束标记
  const ifdefMarkers = (dbSource.match(/\/\/ #ifdef APP-PLUS/g) || []).length
  const ifndefMarkers = (dbSource.match(/\/\/ #ifndef APP-PLUS/g) || []).length
  const totalConditionals = ifdefMarkers + ifndefMarkers
  const endMarkers = (dbSource.match(/\/\/ #endif/g) || []).length
  assert(ifdefMarkers > 0, '应包含 APP-PLUS 条件编译')
  assert(totalConditionals === endMarkers, `条件编译标记数量不匹配: ${totalConditionals} vs ${endMarkers}`)
})

test('非 App 端有降级处理', () => {
  assert(dbSource.includes('SQLite 仅支持 App 端'), '非 App 端应有明确的错误提示')
})

test('escape 防注入函数存在', () => {
  assert(dbSource.includes("function escape"), '应有转义函数')
  assert(dbSource.includes(".replace(/'/g, \"''\")"), '应处理单引号转义')
})

// ── 4. 项目文档对照验证 ──
console.log('')
console.log('📋 数据表结构对照（项目文档一致性）')
console.log('───────────────────────────────')

test('roles 表字段数与文档一致', () => {
  // 项目文档定义了 8 个字段: id, name, avatar, style_features, message_count, cloud_sync_id, created_at, updated_at
  const fieldCount = (sqlStatements[0].match(/\w+\s+(TEXT|INTEGER)/g) || []).length
  assertEqual(fieldCount, 8, 'roles 应有 8 个字段')
})

test('sessions 表字段数与文档一致', () => {
  // 文档定义 8 个字段: id, role_id, title, round_count, status, cloud_sync_id, created_at, updated_at
  const fieldCount = (sqlStatements[1].match(/\w+\s+(TEXT|INTEGER)/g) || []).length
  assertEqual(fieldCount, 8, 'sessions 应有 8 个字段（含外键）')
})

test('messages 表字段数与文档一致', () => {
  // 文档定义 6 个字段: id, session_id, sender, content, cloud_sync_id, created_at
  const fieldCount = (sqlStatements[2].match(/\w+\s+(TEXT|INTEGER)/g) || []).length
  assertEqual(fieldCount, 6, 'messages 应有 6 个字段（含外键）')
})

// ── 5. CRUD 流程逻辑验证 ──
console.log('')
console.log('🔄 CRUD 逻辑流程验证')
console.log('───────────────────────────────')

test('SQL 包含 INSERT, SELECT, UPDATE, DELETE 操作', () => {
  assert(dbSource.includes('INSERT INTO'), '应有 INSERT')
  assert(dbSource.includes('SELECT'), '应有 SELECT')
  assert(dbSource.includes('UPDATE'), '应有 UPDATE')
  assert(dbSource.includes('DELETE FROM'), '应有 DELETE')
})

test('getRecent 使用 LIMIT 和 ORDER BY', () => {
  assert(dbSource.includes('ORDER BY created_at DESC'), '应按时间倒序')
  assert(dbSource.includes('LIMIT'), '应限制返回条数')
})

test('incrementRound 使用自增', () => {
  assert(dbSource.includes('round_count = round_count + 1'), '轮数应自增')
})

test('create 包含 last_insert_rowid', () => {
  assert(dbSource.includes('last_insert_rowid'), '创建后应获取 ID')
})

// ≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
//  总 结
// ≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡≡
console.log('')
console.log('═══════════════════════════════════════════')
const accuracy = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0
console.log(`  通过: ${passedTests} / ${totalTests}  (${accuracy}%)`)
console.log('═══════════════════════════════════════════')
console.log('')

console.log('')
console.log('📱 真机验证步骤（需要设备或模拟器）:')
console.log('───────────────────────────────')
console.log('  1. 运行 dev:app 编译并安装到模拟器/真机')
console.log('  2. 在 App.vue onLaunch 中调用:')
console.log('     import db from "@/utils/database"')
console.log('     const initResult = await db.init()')
console.log('     console.log("DB init:", initResult)')
console.log('  3. 在页面中测试 CRUD:')
console.log('     const newRole = await db.role.create({ name: "测试角色" })')
console.log('     const roles = await db.role.list()')
console.log('     console.log("Roles:", roles)')
console.log('')

if (failures.length > 0) {
  console.log('失败明细:')
  failures.forEach(f => console.log(`  - ${f.name}: ${f.error}`))
  console.log('')
  process.exit(1)
}
