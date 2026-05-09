/**
 * SQLite 数据库封装
 *
 * 基于 HTML5+ plus.sqlite API（App 端专用）
 * 小程序端不使用本地 SQLite，直接读写云端
 *
 * 使用方式：
 *   import db from '@/utils/database'
 *   await db.init()
 *   await db.role.create({ name: '张三' })
 */

// 数据库名称
const DB_NAME = 'ai_chat_app'
const DB_PATH = '_doc/ai_chat_app.db'

/**
 * 判断当前是否为 App 端且 plus 可用
 */
function isAppPlatform() {
  // #ifdef APP-PLUS
  return typeof plus !== 'undefined' && plus.sqlite
  // #endif
  // #ifndef APP-PLUS
  return false
  // #endif
}

/**
 * 打开数据库
 * @returns {Promise<void>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (!isAppPlatform()) {
      reject(new Error('SQLite 仅支持 App 端'))
      return
    }
    // #ifdef APP-PLUS
    plus.sqlite.openDatabase({
      name: DB_NAME,
      path: DB_PATH,
      success: resolve,
      fail: (e) => reject(new Error(`打开数据库失败: ${e.message}`))
    })
    // #endif
  })
}

/**
 * 关闭数据库
 * @returns {Promise<void>}
 */
function closeDB() {
  return new Promise((resolve, reject) => {
    if (!isAppPlatform()) {
      resolve() // 非 App 端直接返回
      return
    }
    // #ifdef APP-PLUS
    plus.sqlite.closeDatabase({
      name: DB_NAME,
      success: resolve,
      fail: (e) => reject(new Error(`关闭数据库失败: ${e.message}`))
    })
    // #endif
  })
}

/**
 * 执行 SQL（INSERT/UPDATE/DELETE/CREATE）
 * @param {string} sql
 * @param {Array} [params] - 参数列表（预留，plus.sqlite 不支持参数化查询）
 * @returns {Promise<void>}
 */
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    if (!isAppPlatform()) {
      reject(new Error('SQLite 仅支持 App 端'))
      return
    }
    // #ifdef APP-PLUS
    plus.sqlite.executeSql({
      name: DB_NAME,
      sql,
      success: (res) => resolve(res),
      fail: (e) => reject(new Error(`SQL 执行失败: ${e.message}\nSQL: ${sql}`))
    })
    // #endif
  })
}

/**
 * 查询（SELECT）
 * @param {string} sql
 * @returns {Promise<Array>}
 */
function selectSQL(sql) {
  return new Promise((resolve, reject) => {
    if (!isAppPlatform()) {
      reject(new Error('SQLite 仅支持 App 端'))
      return
    }
    // #ifdef APP-PLUS
    plus.sqlite.selectSql({
      name: DB_NAME,
      sql,
      success: (res) => resolve(res || []),
      fail: (e) => reject(new Error(`查询失败: ${e.message}\nSQL: ${sql}`))
    })
    // #endif
  })
}

// ──────────────────────────────
//  数据库初始化
// ──────────────────────────────

/**
 * 建表语句
 */
const CREATE_TABLES = [
  // 角色表
  `CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    style_features TEXT DEFAULT '',
    message_count INTEGER DEFAULT 0,
    cloud_sync_id TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  )`,
  // 对话会话表
  `CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    title TEXT DEFAULT '',
    round_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    cloud_sync_id TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
  )`,
  // 消息表
  `CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    sender TEXT NOT NULL CHECK(sender IN ('user', 'ai')),
    content TEXT NOT NULL,
    cloud_sync_id TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
  )`,
  // 应用配置表
  `CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT ''
  )`
]

/**
 * 初始化数据库（建表）
 * @returns {Promise<{success: boolean, tables: string[]}>}
 */
async function init() {
  if (!isAppPlatform()) {
    return {
      success: false,
      error: 'SQLite 仅支持 App 端',
      tables: []
    }
  }

  await openDB()

  const createdTables = []
  for (const sql of CREATE_TABLES) {
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1]
    try {
      await executeSQL(sql)
      if (tableName) createdTables.push(tableName)
    } catch (e) {
      throw new Error(`建表失败 ${tableName}: ${e.message}`)
    }
  }

  return {
    success: true,
    tables: createdTables
  }
}

// ──────────────────────────────
//  角色 CRUD
// ──────────────────────────────

const role = {
  /**
   * 创建角色
   */
  async create({ name, avatar = '' }) {
    if (!name) throw new Error('角色名不能为空')
    const sql = `INSERT INTO roles (name, avatar) VALUES ('${escape(name)}', '${escape(avatar)}')`
    await executeSQL(sql)
    const rows = await selectSQL('SELECT last_insert_rowid() as id')
    return { id: rows[0]?.id, name, avatar }
  },

  /**
   * 获取所有角色
   */
  async list() {
    return await selectSQL('SELECT * FROM roles ORDER BY updated_at DESC')
  },

  /**
   * 根据 ID 获取角色
   */
  async getById(id) {
    const rows = await selectSQL(`SELECT * FROM roles WHERE id = ${Number(id)}`)
    return rows[0] || null
  },

  /**
   * 更新角色
   */
  async update(id, fields) {
    const sets = Object.entries(fields)
      .map(([k, v]) => `${k} = '${escape(String(v))}'`)
      .join(', ')
    await executeSQL(`UPDATE roles SET ${sets}, updated_at = datetime('now','localtime') WHERE id = ${Number(id)}`)
  },

  /**
   * 删除角色（级联删除相关会话和消息）
   */
  async remove(id) {
    const numId = Number(id)
    // 外键级联删除，需先启用外键
    await executeSQL('PRAGMA foreign_keys = ON')
    await executeSQL(`DELETE FROM roles WHERE id = ${numId}`)
  }
}

// ──────────────────────────────
//  会话 CRUD
// ──────────────────────────────

const session = {
  /**
   * 创建会话
   */
  async create({ roleId, title = '' }) {
    const sql = `INSERT INTO sessions (role_id, title) VALUES (${Number(roleId)}, '${escape(title)}')`
    await executeSQL(sql)
    const rows = await selectSQL('SELECT last_insert_rowid() as id')
    return { id: rows[0]?.id }
  },

  /**
   * 获取指定角色的所有会话
   */
  async listByRole(roleId) {
    return await selectSQL(
      `SELECT * FROM sessions WHERE role_id = ${Number(roleId)} ORDER BY updated_at DESC`
    )
  },

  /**
   * 增加轮数计数
   */
  async incrementRound(id) {
    await executeSQL(
      `UPDATE sessions SET round_count = round_count + 1, updated_at = datetime('now','localtime') WHERE id = ${Number(id)}`
    )
  },

  /**
   * 标记会话已到达上限
   */
  async markFull(id) {
    await executeSQL(
      `UPDATE sessions SET status = 'full', updated_at = datetime('now','localtime') WHERE id = ${Number(id)}`
    )
  }
}

// ──────────────────────────────
//  消息 CRUD
// ──────────────────────────────

const message = {
  /**
   * 插入消息
   */
  async create({ sessionId, sender, content }) {
    if (!['user', 'ai'].includes(sender)) throw new Error('sender 必须为 user 或 ai')
    const sql = `INSERT INTO messages (session_id, sender, content) VALUES (${Number(sessionId)}, '${sender}', '${escape(content)}')`
    await executeSQL(sql)
    const rows = await selectSQL('SELECT last_insert_rowid() as id')
    return { id: rows[0]?.id }
  },

  /**
   * 获取会话的消息列表
   */
  async listBySession(sessionId) {
    return await selectSQL(
      `SELECT * FROM messages WHERE session_id = ${Number(sessionId)} ORDER BY created_at ASC`
    )
  },

  /**
   * 获取最近 N 条消息（用于 AI 上下文）
   */
  async getRecent(sessionId, limit = 15) {
    return await selectSQL(
      `SELECT * FROM messages WHERE session_id = ${Number(sessionId)} ORDER BY created_at DESC LIMIT ${Number(limit)}`
    )
  }
}

// ──────────────────────────────
//  应用配置
// ──────────────────────────────

const config = {
  async get(key) {
    const rows = await selectSQL(`SELECT value FROM app_config WHERE key = '${escape(key)}'`)
    return rows[0]?.value || null
  },

  async set(key, value) {
    await executeSQL(
      `INSERT OR REPLACE INTO app_config (key, value) VALUES ('${escape(key)}', '${escape(value)}')`
    )
  }
}

/**
 * 简单的 SQL 转义（防止注入）
 */
function escape(str) {
  if (typeof str !== 'string') return String(str)
  return str.replace(/'/g, "''")
}

export default {
  init,
  isAppPlatform,
  role,
  session,
  message,
  config,
  // 测试用
  _executeSQL: executeSQL,
  _selectSQL: selectSQL,
  _close: closeDB
}
