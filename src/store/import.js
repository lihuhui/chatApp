/**
 * 导入流程 Store
 *
 * 职责：管理导入全流程的临时状态
 * 作用域：App 端专用（条件编译包裹）
 * 持久化：否（流程结束或页面离开时重置）
 *
 * 使用方式：
 *   import { useImportStore } from '@/store'
 *   const importStore = useImportStore()
 *   importStore.setRawText(text)
 *   importStore.setParseResult(result)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STEPS = ['guide', 'paste', 'parsing', 'confirm', 'extracting', 'report']

export const useImportStore = defineStore('import', () => {
  // ── 状态 ──

  /** 当前步骤 */
  const step = ref('guide')

  /** 用户粘贴的原始聊天记录 */
  const rawText = ref('')

  /** 解析结果 */
  const parseResult = ref(null)

  /** 识别到的说话人列表 */
  const speakers = ref([])

  /** 用户选择的说话人 */
  const selectedSpeaker = ref(null)

  /** 风格分析报告 */
  const styleReport = ref(null)

  /** 特征提取进度 (0-100) */
  const progress = ref(0)

  /** 错误信息 */
  const error = ref('')

  // ── 计算属性 ──

  /** 步骤索引 */
  const stepIndex = computed(() => STEPS.indexOf(step.value))

  /** 总步骤数 */
  const totalSteps = computed(() => STEPS.length)

  /** 是否为最后一步 */
  const isLastStep = computed(() => step.value === STEPS[STEPS.length - 1])

  /** 是否为第一步 */
  const isFirstStep = computed(() => step.value === STEPS[0])

  // ── 步骤导航 ──

  function goToStep(newStep) {
    if (STEPS.includes(newStep)) {
      step.value = newStep
      error.value = ''
    }
  }

  function nextStep() {
    const idx = STEPS.indexOf(step.value)
    if (idx < STEPS.length - 1) {
      step.value = STEPS[idx + 1]
      error.value = ''
    }
  }

  function prevStep() {
    const idx = STEPS.indexOf(step.value)
    if (idx > 0) {
      step.value = STEPS[idx - 1]
    }
  }

  // ── 数据管理 ──

  function setRawText(text) {
    rawText.value = text
  }

  function setParseResult(result) {
    parseResult.value = result
    if (result && result.speakers) {
      speakers.value = result.speakers
    }
  }

  function setSpeakers(list) {
    speakers.value = list
  }

  function setSelectedSpeaker(name) {
    selectedSpeaker.value = name
  }

  function setStyleReport(report) {
    styleReport.value = report
  }

  function updateProgress(val) {
    progress.value = Math.min(100, Math.max(0, val))
  }

  // ── 重置 ──

  function reset() {
    step.value = 'guide'
    rawText.value = ''
    parseResult.value = null
    speakers.value = []
    selectedSpeaker.value = null
    styleReport.value = null
    progress.value = 0
    error.value = ''
  }

  return {
    step,
    rawText,
    parseResult,
    speakers,
    selectedSpeaker,
    styleReport,
    progress,
    error,
    stepIndex,
    totalSteps,
    isLastStep,
    isFirstStep,
    goToStep,
    nextStep,
    prevStep,
    setRawText,
    setParseResult,
    setSpeakers,
    setSelectedSpeaker,
    setStyleReport,
    updateProgress,
    reset
  }
})
