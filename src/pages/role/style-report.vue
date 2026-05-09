<template>
  <view class="page">
    <Loading v-if="loading" />
    <view v-else>
      <view class="summary-card">
        <text class="title">风格分析报告</text>
        <text class="subtitle">
          基于 {{ reportData?.speakerMessageCount || reportData?.messageCount || 0 }} 条消息分析
        </text>
        <view class="summary-tags">
          <StyleTag
            v-if="reportData?.report?.tone?.overallTone"
            :label="reportData.report.tone.overallTone"
            type="default"
          />
          <StyleTag
            v-if="reportData?.report?.emoji?.overallStyle"
            :label="reportData.report.emoji.overallStyle"
            type="emotional"
          />
          <StyleTag
            v-if="reportData?.report?.messageLength?.lengthLevel"
            :label="reportData.report.messageLength.lengthLevel"
            type="concise"
          />
        </view>
      </view>

      <view class="sections">
        <StyleReportCard
          dimension="回复长度"
          :value="reportData?.report?.messageLength?.lengthLevel || '-'"
          :detail="lengthDetail"
        />
        <StyleReportCard
          dimension="语气风格"
          :value="reportData?.report?.tone?.overallTone || '-'"
          :detail="toneDetail"
        />
        <StyleReportCard
          dimension="表情使用"
          :value="reportData?.report?.emoji?.overallStyle || '-'"
          :detail="emojiDetail"
        />
        <StyleReportCard
          dimension="常用词汇"
          :value="topWordDisplay"
          :detail="wordsDetail"
        />
      </view>

      <button class="next-btn" @click="startChat">开始对话</button>
    </view>
  </view>
</template>

<script>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useImportStore, useRoleStore, useChatStore } from '@/store'
import Loading from '@/components/common/Loading.vue'
import StyleTag from '@/components/business/StyleTag.vue'
import StyleReportCard from '@/components/business/StyleReportCard.vue'

export default {
  components: { Loading, StyleTag, StyleReportCard },
  setup() {
    const importStore = useImportStore()
    const roleStore = useRoleStore()
    const chatStore = useChatStore()

    const loading = ref(true)
    const reportData = ref(null)

    onShow(() => {
      const data = importStore.styleReport
      if (data && data.success) {
        reportData.value = data
        loading.value = false
      } else {
        uni.showToast({ title: '未找到分析数据', icon: 'none' })
        setTimeout(() => uni.navigateBack(), 1500)
      }
    })

    // 计算各维度的详情描述
    const lengthDetail = computed(() => {
      const ml = reportData.value?.report?.messageLength
      if (!ml) return ''
      return `平均 ${ml.averageLength} 字/条，最短 ${ml.minLength} 字，最长 ${ml.maxLength} 字。${ml.stability || ''}`
    })

    const toneDetail = computed(() => {
      const t = reportData.value?.report?.tone
      if (!t) return ''
      const parts = [`偏向${t.colloquialLevel || '中性'}表达`]
      if (t.colloquialScore != null) {
        parts.push(`口语化得分 ${(t.colloquialScore * 100).toFixed(0)}%`)
      }
      return parts.join('，')
    })

    const emojiDetail = computed(() => {
      const e = reportData.value?.report?.emoji
      if (!e) return ''
      const parts = []
      if (e.totalEmojis > 0) {
        parts.push(`共使用 ${e.totalEmojis} 个表情`)
        const top = (e.topEmojis || []).slice(0, 3).map(i => i.emoji || i).join(' ')
        if (top) parts.push(`常用：${top}`)
      } else {
        parts.push('基本不使用表情符号')
      }
      return parts.join('，')
    })

    const topWordDisplay = computed(() => {
      const vocab = reportData.value?.report?.vocabulary
      if (!vocab || !vocab.topWords || vocab.topWords.length === 0) return '-'
      const w = vocab.topWords[0]
      return w.word || w
    })

    const wordsDetail = computed(() => {
      const vocab = reportData.value?.report?.vocabulary
      if (!vocab || !vocab.topWords) return ''
      const topWords = vocab.topWords.slice(0, 8).map(w => w.word || w).join('、')
      return topWords ? `高频词：${topWords}` : ''
    })

    function startChat() {
      if (!reportData.value) return

      const speakerName = reportData.value.targetSpeaker || '分析角色'
      if (!roleStore.currentRole) {
        roleStore.setCurrentRole({
          id: Date.now().toString(),
          name: speakerName,
          styleReport: reportData.value,
          messageCount: reportData.value.speakerMessageCount || 0
        })
      }

      chatStore.createSession(roleStore.currentRole.id, roleStore.currentRole.name)
      uni.switchTab({ url: '/pages/chat/chat' })
    }

    return { loading, reportData, startChat, lengthDetail, toneDetail, emojiDetail, topWordDisplay, wordsDetail }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.page {
  min-height: 100vh;
  background: $ink-bg;
  padding: 24rpx;
  animation: pageIn 0.4s $ease-out both;
}

@keyframes pageIn {
  from { opacity: 0; transform: translateY(16rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.summary-card {
  background: linear-gradient(135deg, $ink-primary, #3AAFA0);
  border-radius: $radius-lg;
  padding: 48rpx 40rpx;
  margin-bottom: 24rpx;
  text-align: center;
  box-shadow: 0 8rpx 32rpx rgba(42, 157, 143, 0.25);
  animation: cardDrop 0.5s $ease-out both;
}

@keyframes cardDrop {
  from { opacity: 0; transform: translateY(-20rpx) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.title {
  font-size: $font-xxl;
  font-weight: 700;
  color: #fff;
  display: block;
  letter-spacing: 2rpx;
}

.subtitle {
  font-size: $font-sm;
  color: rgba(255,255,255,0.75);
  margin-top: 10rpx;
  display: block;
}

.summary-tags {
  display: flex;
  justify-content: center;
  gap: 12rpx;
  margin-top: 24rpx;
  flex-wrap: wrap;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 32rpx;

  > * {
    animation: sectionSlide 0.4s $ease-out both;
    &:nth-child(1) { animation-delay: 0.1s; }
    &:nth-child(2) { animation-delay: 0.18s; }
    &:nth-child(3) { animation-delay: 0.26s; }
    &:nth-child(4) { animation-delay: 0.34s; }
  }
}

@keyframes sectionSlide {
  from { opacity: 0; transform: translateX(-16rpx); }
  to { opacity: 1; transform: translateX(0); }
}

.next-btn {
  width: 100%; height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  color: #fff;
  border-radius: $radius-md;
  font-size: $font-md;
  font-weight: 600;
  border: none;
  letter-spacing: 2rpx;
  transition: all $transition-fast;

  &:active {
    transform: scale(0.97);
    box-shadow: 0 4rpx 16rpx rgba(42, 157, 143, 0.35);
  }
}
</style>
