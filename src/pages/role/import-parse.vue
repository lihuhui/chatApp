<template>
  <view class="page">
    <!-- Phase 1: 输入 -->
    <template v-if="phase === 'input'">
      <view class="phase-input stagger-enter">

        <!-- OCR 模式：截图上传区域 -->
        <template v-if="inputMode === 'ocr'">
          <view class="phase-header" style="animation-delay: 0s">
            <text class="phase-title">截图识别</text>
            <text class="phase-desc">选择微信聊天截图，自动识别文字</text>
          </view>

          <view class="ocr-section" style="animation-delay: 0.08s">
            <!-- 图片预览网格 -->
            <view v-if="images.length > 0" class="image-grid">
              <view class="image-item" v-for="(img, i) in images" :key="i">
                <image class="image-thumb" :src="img" mode="aspectFill" />
                <view class="image-delete" @click.stop="removeImage(i)">
                  <text class="delete-icon">×</text>
                </view>
              </view>
            </view>

            <!-- 添加图片按钮 -->
            <view
              class="add-image-btn press-scale"
              :class="{ 'add-btn-compact': images.length > 0 }"
              @click="chooseImages"
              v-if="images.length < 9"
            >
              <text class="add-icon">+</text>
              <text class="add-text">{{ images.length > 0 ? '继续添加' : '添加截图' }}</text>
            </view>

            <!-- 识别按钮 -->
            <view
              v-if="images.length > 0"
              class="ocr-btn press-scale"
              @click="onOcrRecognize"
            >
              <text class="ocr-btn-label">识别文字</text>
            </view>
          </view>
        </template>

        <!-- 粘贴模式：textarea -->
        <template v-if="inputMode === 'paste'">
          <view class="phase-header" style="animation-delay: 0s">
            <text class="phase-title">粘贴聊天记录</text>
            <text class="phase-desc">从微信复制聊天记录，粘贴到下方区域</text>
          </view>
        </template>

        <!-- 识别结果 / 手动输入 textarea -->
        <view v-if="inputMode === 'paste' || rawText" class="text-area-wrap" :style="{ animationDelay: inputMode === 'paste' ? '0.08s' : '0s' }">
          <view v-if="inputMode === 'ocr' && rawText" class="ocr-result-label">
            <text class="result-tag">识别结果</text>
          </view>
          <textarea
            class="paste-area"
            v-model="rawText"
            :placeholder="inputMode === 'ocr' ? '识别结果将显示在此，你也可以手动修改…' : '在此粘贴聊天记录...'"
            maxlength="-1"
          />
        </view>

        <!-- 格式提示 -->
        <view v-if="inputMode === 'paste' || rawText" class="tips press-scale" @click="showFormatTips" style="animation-delay: 0.12s">
          <text class="tip-icon"> </text>
          <text class="tip-text">支持 iOS / Android / PC 三种格式</text>
        </view>

        <!-- 超量警告 -->
        <view v-if="messageCount > 3000" class="warning-banner" style="animation-delay: 0.16s">
          <text class="warning-text">⚠️ 消息超过 3000 条（共 {{ messageCount }} 条），建议只粘贴最近一段时间的记录</text>
        </view>

        <!-- 切换方式 -->
        <view class="mode-switch" style="animation-delay: 0.2s" @click="toggleMode">
          <text class="switch-text">{{ inputMode === 'ocr' ? '切换到手动粘贴' : '切换到截图识别' }}</text>
        </view>

        <!-- 解析按钮 -->
        <view class="parse-btn-wrap" style="animation-delay: 0.24s" v-if="inputMode === 'paste' || rawText">
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

    <!-- Phase 2: OCR 识别中 -->
    <view v-if="phase === 'ocr-processing'" class="phase-center">
      <view class="ocr-processing-view">
        <Loading type="dots" text="正在识别截图文字…" />
      </view>
    </view>

    <!-- Phase 3: 解析中 -->
    <view v-if="phase === 'parsing'" class="phase-center">
      <Loading type="dots" text="正在解析聊天记录…" />
    </view>

    <!-- Phase 4: 解析结果 + 说话人选择 -->
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

    <!-- Phase 5: 特征提取中 -->
    <view v-if="phase === 'extracting'" class="phase-center">
      <view class="extracting-view">
        <view class="extracting-icon"> </view>
        <text class="extracting-text">正在分析语言风格特征…</text>
        <ProgressBar :progress="progress" />
        <text class="extracting-hint">分析完成后自动跳转报告页</text>
      </view>
    </view>

    <!-- Phase 6: 错误状态 -->
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
import { ocrRecognize } from '@/utils/ocr'
import Loading from '@/components/common/Loading.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ParseResultPreview from '@/components/business/ParseResultPreview.vue'
import SpeakerSelector from '@/components/business/SpeakerSelector.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

export default {
  components: { Loading, ErrorState, ParseResultPreview, SpeakerSelector, ProgressBar },
  setup() {
    const importStore = useImportStore()

    // 从 URL 参数读取输入模式
    const pages = getCurrentPages()
    const query = pages[pages.length - 1].options || {}
    const inputMode = ref(query.mode || 'ocr')

    // 页面阶段: input → ocr-processing / parsing → result → extracting → (navigate)
    const phase = ref('input')
    const parsing = ref(false)
    const rawText = ref(importStore.rawText || '')
    const images = ref([])
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
        if (importStore.parseResult) {
          parseResult.value = importStore.parseResult
          selectedSpeakers.value = importStore.selectedSpeaker
            ? [importStore.selectedSpeaker]
            : []
          phase.value = 'result'
        }
      }
    })

    // rawText 变更时同步回 store
    watch(rawText, (val) => {
      importStore.setRawText(val)
    })

    function toggleMode() {
      inputMode.value = inputMode.value === 'ocr' ? 'paste' : 'ocr'
    }

    function chooseImages() {
      const remaining = 9 - images.value.length
      if (remaining <= 0) return
      uni.chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          images.value.push(...res.tempFilePaths)
        }
      })
    }

    function removeImage(index) {
      images.value.splice(index, 1)
    }

    async function onOcrRecognize() {
      if (images.value.length === 0) return
      phase.value = 'ocr-processing'
      try {
        const text = await ocrRecognize(images.value)
        rawText.value = text
        inputMode.value = 'paste'
        phase.value = 'input'
      } catch (e) {
        errorMessage.value = e.message || '识别失败，请重试'
        phase.value = 'error'
      }
    }

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

      setTimeout(() => {
        try {
          const result = parse(rawText.value)
          if (result.success) {
            parseResult.value = result
            importStore.setParseResult(result)
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

      phase.value = 'extracting'
      runFeatureExtraction(targetSpeaker)
    }

    function runFeatureExtraction(targetSpeaker) {
      const messages = parseResult.value.messages
      let currentProgress = 0

      const timer = setInterval(() => {
        currentProgress += Math.random() * 15 + 5
        if (currentProgress > 90) {
          clearInterval(timer)
          currentProgress = 90
        }
        progress.value = Math.min(currentProgress, 90)
      }, 200)

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
      phase, parsing, rawText, images, messageCount, parseResult,
      selectedSpeakers, progress, errorMessage, inputMode,
      toggleMode, chooseImages, removeImage, onOcrRecognize,
      showFormatTips, onParse, onUpdateSpeakers,
      onConfirmSpeaker, onRetry
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.page { min-height: 100vh; background: $ink-bg; padding: 24rpx; }

// ── 输入阶段 ──
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

// ── OCR 截图区域 ──
.ocr-section {
  margin-bottom: 20rpx;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.image-item {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  border-radius: $radius-sm;
  overflow: hidden;
}

.image-thumb {
  width: 100%;
  height: 100%;
}

.image-delete {
  position: absolute;
  top: 0;
  right: 0;
  width: 36rpx;
  height: 36rpx;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 0 $radius-sm;
}

.delete-icon {
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1;
}

.add-image-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 160rpx;
  height: 160rpx;
  background: $ink-surface;
  border: 2rpx dashed $ink-border;
  border-radius: $radius-sm;
  transition: border-color $transition-fast;

  &:active {
    border-color: $ink-primary;
  }
}

.add-btn-compact {
  width: 120rpx;
  height: 120rpx;
}

.add-icon {
  font-size: 48rpx;
  color: $ink-text-tertiary;
  line-height: 1;
}

.add-text {
  font-size: $font-xs;
  color: $ink-text-secondary;
  margin-top: 4rpx;
}

.ocr-btn {
  width: 100%;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  color: #fff;
  border-radius: $radius-md;
  font-size: $font-md;
  font-weight: 600;
  margin-top: 16rpx;
}

.ocr-btn-label { line-height: 1; }

// ── 文本输入区域 ──
.text-area-wrap {
  margin-bottom: 16rpx;
}

.ocr-result-label {
  margin-bottom: 12rpx;
}

.result-tag {
  font-size: $font-xs;
  color: $ink-primary;
  background: $ink-primary-light;
  padding: 4rpx 16rpx;
  border-radius: $radius-full;
  font-weight: 500;
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

// ── 切换方式 ──
.mode-switch {
  padding: 20rpx 0;
  text-align: center;
}

.switch-text {
  font-size: $font-sm;
  color: $ink-primary;
  text-decoration: underline;
}

// ── 解析按钮 ──
.parse-btn-wrap {
  margin-top: 8rpx;
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

// ── OCR 识别中 ──
.ocr-processing-view {
  padding: 60rpx 40rpx;
  text-align: center;
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
