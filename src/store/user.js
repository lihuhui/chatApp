/**
 * 用户标识 Store
 *
 * 职责：
 *   1. 首次启动时生成全局唯一 userId
 *   2. 持久化 userId 到本地存储
 *   3. 自动感知当前运行平台（App / 小程序）
 *
 * 使用方式：
 *   import { useUserStore } from '@/store/user'
 *   const user = useUserStore()
 *   console.log(user.userId) // "xxxxxxxx-xxxx-4xxx-..."
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateUUID } from '@/utils/uuid'

const STORAGE_KEY = 'ai_chat_user_id'

/**
 * 获取平台标识
 */
function detectPlatform() {
  // #ifdef APP-PLUS
  return 'app'
  // #endif
  // #ifdef MP-WEIXIN
  return 'mp'
  // #endif
  // #ifdef H5
  return 'h5'
  // #endif
  return 'unknown'
}

export const useUserStore = defineStore('user', () => {
  // ── 状态 ──

  const userId = ref('')
  const platform = ref(detectPlatform())
  const createdAt = ref('')

  // ── 初始化 ──

  function init() {
    // 从本地存储读取已有 userId
    const stored = loadUserId()
    if (stored) {
      userId.value = stored
    } else {
      // 首次启动：生成新 UUID 并持久化
      const newId = generateUUID()
      userId.value = newId
      saveUserId(newId)
      createdAt.value = new Date().toISOString()
    }
  }

  // ── 持久化 ──

  function loadUserId() {
    try {
      return uni.getStorageSync(STORAGE_KEY) || ''
    } catch {
      return ''
    }
  }

  function saveUserId(id) {
    try {
      uni.setStorageSync(STORAGE_KEY, id)
    } catch {
      // 存储空间不足时静默失败
      console.warn('[user] 持久化 userId 失败')
    }
  }

  // ── 计算属性 ──

  const isReady = computed(() => !!userId.value)
  const isApp = computed(() => platform.value === 'app')
  const isMp = computed(() => platform.value === 'mp')

  return {
    userId,
    platform,
    createdAt,
    isReady,
    isApp,
    isMp,
    init
  }
})
