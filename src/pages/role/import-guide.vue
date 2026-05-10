<template>
  <PageContainer title="导入聊天记录">
    <view class="card-list stagger-enter">
      <view
        class="method-card press-scale"
        v-for="(m, i) in methods"
        :key="i"
        :style="{ animationDelay: i * 0.12 + 's' }"
        @click="onSelect(m.mode)"
      >
        <view class="card-body">
          <view class="card-header">
            <text class="card-icon">{{ m.icon }}</text>
            <view class="card-info">
              <text class="card-title">{{ m.title }}</text>
              <text class="card-recommended" v-if="m.recommended">推荐</text>
            </view>
          </view>
          <text class="card-desc">{{ m.desc }}</text>
        </view>
        <text class="card-arrow">→</text>
      </view>
    </view>
  </PageContainer>
</template>

<script>
import { ref } from 'vue'
import { useImportStore } from '@/store'
import PageContainer from '@/components/common/PageContainer.vue'

export default {
  components: { PageContainer },
  setup() {
    const importStore = useImportStore()
    const methods = ref([
      {
        icon: ' ',
        title: '截图识别',
        desc: '截取微信聊天截图，自动识别文字内容',
        mode: 'ocr',
        recommended: true
      },
      {
        icon: ' ',
        title: '手动粘贴',
        desc: '从微信复制聊天记录，直接粘贴到 App',
        mode: 'paste',
        recommended: false
      }
    ])

    function onSelect(mode) {
      importStore.goToStep('paste')
      uni.navigateTo({ url: `/pages/role/import-parse?mode=${mode}` })
    }

    return { methods, onSelect }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.card-list { padding: 24rpx; }

.method-card {
  display: flex;
  align-items: center;
  background: $ink-surface;
  border-radius: $radius-md;
  padding: 36rpx 30rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-sm;
  border-left: $binding-width solid $ink-primary-light;
  transition: border-color $transition-fast;

  &:active {
    border-left-color: $ink-primary;
  }
}

.card-body { flex: 1; }

.card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 10rpx;
}

.card-icon { font-size: 40rpx; }

.card-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.card-title {
  font-size: $font-md;
  font-weight: 600;
  color: $ink-text;
}

.card-recommended {
  font-size: $font-xs;
  color: $ink-primary;
  background: $ink-primary-light;
  padding: 2rpx 12rpx;
  border-radius: $radius-full;
  font-weight: 500;
}

.card-desc {
  font-size: $font-sm;
  color: $ink-text-secondary;
  line-height: 1.6;
  display: block;
  margin-left: 52rpx;
}

.card-arrow {
  font-size: 28rpx;
  color: $ink-text-tertiary;
  flex-shrink: 0;
  transition: transform $transition-fast;
}

.method-card:active .card-arrow {
  transform: translateX(6rpx);
}
</style>
