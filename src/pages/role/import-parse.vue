<template>
  <view class="page">
    <!-- Phase 1: 粘贴输入 -->
    <template v-if="phase === 'input'">
      <view class="phase-input stagger-enter">
        <view class="phase-header" style="animation-delay: 0s">
          <text class="phase-title">粘贴聊天记录</text>
          <text class="phase-desc">从微信复制聊天记录，粘贴到下方区域</text>
        </view>
        <textarea
          class="paste-area"
          v-model="rawText"
          placeholder="在此粘贴聊天记录..."
          maxlength="-1"
          style="animation-delay: 0.08s"
        />
        <view class="tips press-scale" style="animation-delay: 0.12s" @click="showFormatTips">
          <text class="tip-icon">📖</text>
          <text class="tip-text">支持 iOS / Android / PC 三种格式</text>
        </view>
        <view v-if="messageCount > 3000" class="warning-banner" style="animation-delay: 0.16s">
          <text class="warning-text">⚠️ 消息超过 3000 条（共 {{ messageCount }} 条），建议只粘贴最近一段时间的记录</text>
        </view>
        <view class="parse-btn-wrap" style="animation-delay: 0.2s">
          <view
            class="parse-btn press-scale"
            :class="{ 'btn-disabled': !rawText.trim() || parsing }"
            @click="onParse"
          >
            <text v-if="!parsing" class="btn-label">开始解析</text>
            <text v-else class="btn-label">解析中…</text>
          </view>
        </view>
      </view>
    </template>

    <!-- Phase 2: 解析中 -->
    <view v-if="phase === 'parsing'" class="phase-center">
      <Loading type="dots" text="正在解析聊天记录…" />
    </view>

    <!-- Phase 3: 解析结果 + 说话人选择 -->
    <template v-if="phase === 'result' && parseResult">
      <view class="phase-result stagger-enter">
        <ParseResultPreview
          style="animation-delay: 0s"
          :speaker-count="parseResult.speakers.length"
          :message-count="parseResult.summary.afterFilter"
          :filtered-count="parseResult.summary.removedCount"
        />
        <SpeakerSelector
          style="animation-delay: 0.12s"
          :speakers="parseResult.speakers"
          :selected="selectedSpeakers"
          @update="onUpdateSpeakers"
          @confirm="onConfirmSpeaker"
        />
      </view>
    </template>

    <!-- Phase 4: 特征提取中 -->
    <view v-if="phase === 'extracting'" class="phase-center">
      <view class="extracting-view">
        <view class="extracting-icon">🔍</view>
        <text class="extracting-text">正在分析语言风格特征…</text>
        <ProgressBar :progress="progress" />
        <text class="extracting-hint">分析完成后自动跳转报告页</text>
      </view>
    </view>

    <!-- Phase 5: 错误状态 -->
    <ErrorState
      v-if="phase === 'error'"
      :message="errorMessage"
      @retry="onRetry"
    />
  </view>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useImportStore } from '@/store'
import { parse } from '@/utils/parser'
import { generate } from '@/utils/features'
import Loading from '@/components/common/Loading.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ParseResultPreview from '@/components/business/ParseResultPreview.vue'
import SpeakerSelector from '@/components/business/SpeakerSelector.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

export default {
  components: { Loading, ErrorState, ParseResultPreview, SpeakerSelector, ProgressBar },
  setup() {
    const importStore = useImportStore()

    // 页面阶段: input → parsing → result → extracting → (navigate)
    const phase = ref('input')
    const parsing = ref(false)
    const rawText = ref(importStore.rawText || '')
    const messageCount = computed(() => {
      if (!rawText.value) return 0
      return rawText.value.split('\n').filter(l => l.trim()).length
    })
    const parseResult = ref(null)
    const selectedSpeakers = ref([])
    const progress = ref(0)
    const errorMessage = ref('')

    // 每次显示页面时，与 store 同步阶段
    onShow(() => {
      const storeStep = importStore.step

      // 恢复之前粘贴的文本
      if (importStore.rawText && !rawText.value) {
        rawText.value = importStore.rawText
      }

      // 根据 store 步骤同步本地 phase
      if (storeStep === 'result' || storeStep === 'report') {
        // 用户从报告页返回 → 回到结果阶段
        if (importStore.parseResult) {
          parseResult.value = importStore.parseResult
          selectedSpeakers.value = importStore.selectedSpeaker
            ? [importStore.selectedSpeaker]
            : []
          phase.value = 'result'
        }
      }
    })

    // rawText 变更时同步回 store（防止页面切换丢失）
    watch(rawText, (val) => {
      importStore.setRawText(val)
    })

    function showFormatTips() {
      uni.showModal({
        title: '支持的格式',
        content: 'iOS: 昵称 2024/1/15 14:30:22\nAndroid: 昵称 2024/1/15 14:30\nPC: 2024-01-15 14:30:22 昵称'
      })
    }

    async function onParse() {
      if (!rawText.value.trim()) return

      parsing.value = true
      phase.value = 'parsing'
      importStore.setRawText(rawText.value)

      // 使用 setTimeout 让 UI 有机会更新
      setTimeout(() => {
        try {
          const result = parse(rawText.value)
          if (result.success) {
            parseResult.value = result
            importStore.setParseResult(result)
            // 自动选择第一个非空说话人
            if (result.speakers.length > 0) {
              selectedSpeakers.value = [result.speakers[0].name]
            }
            phase.value = 'result'
          } else {
            errorMessage.value = result.error || '解析失败，请检查聊天记录格式'
            phase.value = 'error'
          }
        } catch (e) {
          errorMessage.value = '解析出错：' + (e.message || '未知错误')
          phase.value = 'error'
        }
        parsing.value = false
      }, 100)
    }

    function onUpdateSpeakers(list) {
      selectedSpeakers.value = list
    }

    function onConfirmSpeaker(speakerNames) {
      if (!speakerNames || speakerNames.length === 0) return

      const targetSpeaker = speakerNames[0]
      importStore.setSelectedSpeaker(targetSpeaker)

      // 进入提取阶段
      phase.value = 'extracting'
      runFeatureExtraction(targetSpeaker)
    }

    function runFeatureExtraction(targetSpeaker) {
      const messages = parseResult.value.messages
      let currentProgress = 0

      // 模拟进度动画（实际计算很快，但给用户视觉反馈）
      const timer = setInterval(() => {
        currentProgress += Math.random() * 15 + 5
        if (currentProgress > 90) {
          clearInterval(timer)
          currentProgress = 90
        }
        progress.value = Math.min(currentProgress, 90)
      }, 200)

      // 执行真实特征提取
      setTimeout(() => {
        try {
          const result = generate(messages, targetSpeaker)
          progress.value = 100

          if (result.success) {
            importStore.setStyleReport(result)
            setTimeout(() => {
              importStore.goToStep('report')
              uni.navigateTo({ url: '/pages/role/style-report' })
            }, 500)
          } else {
            errorMessage.value = result.error || '特征分析失败'
            phase.value = 'error'
          }
        } catch (e) {
          clearInterval(timer)
          errorMessage.value = '特征分析出错：' + (e.message || '未知错误')
          phase.value = 'error'
        }
      }, 800)
    }

    function onRetry() {
      phase.value = 'input'
      errorMessage.value = ''
    }

    return {
      phase, parsing, rawText, messageCount, parseResult,
      selectedSpeakers, progress, errorMessage,
      showFormatTips, onParse, onUpdateSpeakers,
      onConfirmSpeaker, onRetry
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.page { min-height: 100vh; background: $ink-bg; padding: 24rpx; }

// ── 粘贴阶段（入场序列） ──
.phase-input {
  animation: phaseEnter 0.4s $ease-out both;
}

@keyframes phaseEnter {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.phase-header {
  margin-bottom: 24rpx;

  .phase-title {
    font-size: $font-xl;
    font-weight: 700;
    color: $ink-text;
    display: block;
  }

  .phase-desc {
    font-size: $font-sm;
    color: $ink-text-secondary;
    margin-top: 6rpx;
    display: block;
  }
}

.paste-area {
  width: 100%; height: 360rpx;
  background: $ink-surface; border-radius: $radius-md;
  padding: 24rpx; font-size: $font-base; line-height: 1.6;
  border: 2rpx solid transparent;
  transition: border-color $transition-fast;
  box-sizing: border-box;

  &:focus {
    border-color: $ink-primary;
  }
}

.tips {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 0;

  .tip-icon { font-size: 28rpx; }
  .tip-text { font-size: $font-sm; color: $ink-text-secondary; }
}

.warning-banner {
  background: $ink-warning-light;
  border-radius: $radius-sm;
  padding: 16rpx 20rpx;
  margin: 8rpx 0;
  border-left: 6rpx solid $ink-warning;
}
.warning-text { font-size: $font-sm; color: #B89440; line-height: 1.5; }

.parse-btn-wrap {
  margin-top: 16rpx;
}

.parse-btn {
  width: 100%; height: 88rpx;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  color: #fff;
  border-radius: $radius-md;
  font-size: $font-md;
  font-weight: 600;
  letter-spacing: 2rpx;

  &.btn-disabled {
    opacity: 0.4;
  }

  .btn-label {
    line-height: 1;
  }
}

// ── 居中过渡阶段 ──
.phase-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  animation: phaseFadeIn 0.35s $ease-out both;
}

@keyframes phaseFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// ── 提取动画 ──
.extracting-view {
  display: flex; flex-direction: column;
  align-items: center;
  padding: 60rpx 40rpx;
  gap: 32rpx;
  text-align: center;
}

.extracting-icon {
  font-size: 80rpx;
  animation: extractingPulse 1.5s ease-in-out infinite;
}

@keyframes extractingPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
}

.extracting-text {
  font-size: $font-lg;
  color: $ink-text;
  font-weight: 600;
}

.extracting-hint {
  font-size: $font-xs;
  color: $ink-text-tertiary;
}

// ── 结果阶段 ──
.phase-result {
  animation: phaseFadeIn 0.4s $ease-out both;
}
</style>
