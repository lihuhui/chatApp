/**
 * 跨端同步 Store
 *
 * 职责：跟踪云端同步状态、待同步变更数
 * 作用域：App 端（上传） + 小程序端（拉取）
 * 持久化：否（状态实时反映当前同步情况）
 *
 * 使用方式：
 *   import { useSyncStore } from '@/store'
 *   const sync = useSyncStore()
 *   sync.startSync()
 *   // ... 执行同步操作 ...
 *   sync.completeSync()
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSyncStore = defineStore('sync', () => {
  // ── 状态 ──

  /** 同步状态 */
  const status = ref('idle') // idle | syncing | success | error

  /** 上次同步时间 */
  const lastSyncTime = ref(null)

  /** 待同步变更数 */
  const pendingCount = ref(0)

  /** 错误信息 */
  const error = ref('')

  // ── 计算属性 ──

  const isSyncing = computed(() => status.value === 'syncing')
  const isIdle = computed(() => status.value === 'idle')
  const isSuccess = computed(() => status.value === 'success')
  const isError = computed(() => status.value === 'error')

  // ── 同步控制 ──

  function startSync() {
    status.value = 'syncing'
    error.value = ''
  }

  function completeSync() {
    status.value = 'success'
    lastSyncTime.value = new Date().toISOString()
    pendingCount.value = 0
  }

  function failSync(errMsg) {
    status.value = 'error'
    error.value = errMsg || '同步失败'
  }

  function resetSync() {
    status.value = 'idle'
    error.value = ''
  }

  // ── 队列管理 ──

  function addPending(count = 1) {
    pendingCount.value += count
  }

  function clearPending() {
    pendingCount.value = 0
  }

  return {
    status,
    lastSyncTime,
    pendingCount,
    error,
    isSyncing,
    isIdle,
    isSuccess,
    isError,
    startSync,
    completeSync,
    failSync,
    resetSync,
    addPending,
    clearPending
  }
})
