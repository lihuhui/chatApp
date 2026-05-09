/**
 * 对话状态 Store
 *
 * 职责：管理会话列表、当前对话消息、轮数计数、打字状态
 * 作用域：App 端 + 小程序端
 * 持久化：是（会话列表存 storage，消息通过 SQLite/API 管理）
 *
 * 使用方式：
 *   import { useChatStore } from '@/store'
 *   const chat = useChatStore()
 *   chat.createSession(roleId, roleName)
 *   await chat.sendMessage('你好')
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateShortId } from '@/utils/uuid'

const STORAGE_KEY = 'ai_chat_sessions'

export const useChatStore = defineStore('chat', () => {
  // ── 状态 ──

  /** 会话列表 */
  const sessions = ref([])

  /** 当前会话 ID */
  const currentSessionId = ref('')

  /** 当前会话消息 */
  const messages = ref([])

  /** AI 是否正在回复 */
  const isTyping = ref(false)

  /** 加载状态 */
  const loading = ref(false)

  /** 每页消息数 */
  const PAGE_SIZE = 30

  /** 当前会话已加载的消息数（用于分页） */
  const loadedCount = ref(0)

  /** 当前会话的消息总数（来自存储） */
  const totalCount = ref(0)

  /** 是否还有更多历史消息 */
  const hasMore = computed(() => loadedCount.value < totalCount.value)

  // ── 计算属性 ──

  /** 当前会话对象 */
  const currentSession = computed(() =>
    sessions.value.find(s => s.id === currentSessionId.value) || null
  )

  /** 当前轮数 */
  const roundCount = computed(() => currentSession.value?.roundCount || 0)

  /** 是否已达上限 */
  const isMaxRound = computed(() => roundCount.value >= 30)

  // ── 初始化 ──

  function init() {
    loadSessions()
  }

  function loadSessions() {
    try {
      const raw = uni.getStorageSync(STORAGE_KEY)
      if (raw) {
        sessions.value = JSON.parse(raw)
      }
    } catch {
      sessions.value = []
    }
  }

  function saveSessions() {
    try {
      uni.setStorageSync(STORAGE_KEY, JSON.stringify(sessions.value))
    } catch {
      console.warn('[chat] 持久化会话列表失败')
    }
  }

  // ── 消息持久化 ──

  /**
   * 获取存储 key
   */
  function storageKey(sessionId) {
    return `chat_msgs_${sessionId}`
  }

  /**
   * 将指定会话的全部消息保存到 Storage
   */
  function saveMessagesToStorage(sessionId) {
    const allMessages = getSessionAllMessages(sessionId)
    try {
      uni.setStorageSync(storageKey(sessionId), JSON.stringify(allMessages))
    } catch (e) {
      console.warn('[chat] 保存消息失败:', e)
    }
  }

  /**
   * 从 Storage 加载指定会话的全部消息
   */
  function loadMessagesFromStorage(sessionId) {
    try {
      const raw = uni.getStorageSync(storageKey(sessionId))
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  /**
   * 获取会话的全量消息缓存
   */
  function getSessionAllMessages(sessionId) {
    // messageStore 是内存中的全量缓存，key 为 sessionId
    if (!messageStore.value) messageStore.value = {}
    return messageStore.value[sessionId] || []
  }

  /** 全量消息缓存 { sessionId: Message[] } */
  const messageStore = ref({})

  /**
   * 加载历史消息（分页，向上翻页时调用）
   * @param {string} sessionId
   * @returns {Promise<number>} 实际加载的消息数
   */
  async function loadHistoryMessages(sessionId) {
    if (!sessionId) return 0

    const allMessages = getSessionAllMessages(sessionId)
    if (loadedCount.value >= allMessages.length) {
      loading.value = false
      return 0
    }

    loading.value = true
    const newCount = Math.min(loadedCount.value + PAGE_SIZE, allMessages.length)

    // 取出比当前更早的一批消息
    const olderMessages = allMessages.slice(-newCount, -loadedCount.value)
    messages.value = [...olderMessages, ...messages.value]
    loadedCount.value = newCount
    loading.value = false
    return olderMessages.length
  }

  // ── 会话管理 ──

  /**
   * 创建新会话
   * @param {string} roleId
   * @param {string} roleName
   * @returns {string} 会话 ID
   */
  function createSession(roleId, roleName) {
    const now = Date.now()
    const session = {
      id: generateShortId(),
      roleId,
      roleName,
      roundCount: 0,
      lastTime: now,
      status: 'active',
      createdAt: now
    }
    sessions.value.unshift(session)
    currentSessionId.value = session.id
    messages.value = []
    saveSessions()
    return session.id
  }

  /**
   * 切换当前会话
   * @param {string} sessionId
   */
  function switchSession(sessionId) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (!session) return
    currentSessionId.value = sessionId

    // 从存储加载全量消息，显示最近 PAGE_SIZE 条
    const allMessages = loadMessagesFromStorage(sessionId)
    messageStore.value[sessionId] = allMessages
    totalCount.value = allMessages.length

    loadedCount.value = Math.min(PAGE_SIZE, allMessages.length)
    messages.value = allMessages.slice(-loadedCount.value)
  }

  /**
   * 获取会话列表（按时间倒序）
   */
  function getSessions() {
    return sessions.value.filter(s => s.status === 'active')
  }

  // ── 消息管理 ──

  /**
   * 添加用户消息（本地即时显示）
   * @param {string} content
   */
  function addUserMessage(content) {
    const sessionId = currentSessionId.value
    const msg = {
      id: generateShortId(),
      sessionId,
      sender: 'user',
      type: 'sent',
      content,
      state: 'sending',
      createdAt: Date.now()
    }
    messages.value.push(msg)
    // 持久化
    persistMessage(sessionId, msg)
    return msg
  }

  /**
   * 将单条消息写入全量缓存并持久化
   */
  function persistMessage(sessionId, msg) {
    if (!sessionId) return
    if (!messageStore.value[sessionId]) {
      messageStore.value[sessionId] = []
    }
    messageStore.value[sessionId].push(msg)
    totalCount.value = messageStore.value[sessionId].length
    saveMessagesToStorage(sessionId)
  }

  /**
   * 标记消息发送结果
   * @param {string} msgId
   * @param {'sent'|'failed'} state
   */
  function updateMessageState(msgId, state) {
    const msg = messages.value.find(m => m.id === msgId)
    if (msg) msg.state = state
  }

  /**
   * 添加 AI 回复
   * @param {string} content
   * @param {number} tokensUsed
   */
  function addReply(content, tokensUsed = 0) {
    const sessionId = currentSessionId.value
    const msg = {
      id: generateShortId(),
      sessionId,
      sender: 'assistant',
      type: 'received',
      content,
      state: '',
      createdAt: Date.now()
    }
    messages.value.push(msg)
    // 持久化
    persistMessage(sessionId, msg)
    return msg
  }

  /**
   * 递增当前会话轮数
   */
  function incrementRound() {
    const session = sessions.value.find(s => s.id === currentSessionId.value)
    if (session) {
      session.roundCount++
      session.lastTime = Date.now()
      saveSessions()
    }
  }

  // ── 打字状态 ──

  function setTyping(val) {
    isTyping.value = val
  }

  // ── 重置 ──

  function reset() {
    currentSessionId.value = ''
    messages.value = []
    isTyping.value = false
  }

  return {
    sessions,
    currentSessionId,
    messages,
    isTyping,
    loading,
    hasMore,
    currentSession,
    roundCount,
    isMaxRound,
    init,
    createSession,
    switchSession,
    getSessions,
    addUserMessage,
    updateMessageState,
    addReply,
    incrementRound,
    setTyping,
    loadHistoryMessages,
    reset
  }
})
