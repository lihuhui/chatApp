<template>
  <view class="ai-error">
    <view class="error-art">
      <text class="error-symbol">⚠️</text>
    </view>
    <view class="error-content">
      <text class="error-message">{{ message || '加载失败，请稍后重试' }}</text>
      <text v-if="hint" class="error-hint">{{ hint }}</text>
    </view>
    <view v-if="retryText" class="retry-btn-wrap press-scale" @click="handleRetry">
      <view class="retry-btn">
        <text class="retry-text">{{ retryText }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    message: { type: String, default: '' },
    hint: { type: String, default: '' },
    retryText: { type: String, default: '重新加载' },
    onRetry: { type: Function, default: null }
  },
  methods: {
    handleRetry() {
      if (typeof this.onRetry === 'function') this.onRetry()
    }
  }
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 60rpx;
  animation: errorShakeIn 0.5s $ease-out both;
}

@keyframes errorShakeIn {
  0% { opacity: 0; transform: translateY(10rpx); }
  20% { transform: translateX(-8rpx); }
  40% { transform: translateX(8rpx); }
  60% { transform: translateX(-4rpx); }
  80% { transform: translateX(4rpx); }
  100% { opacity: 1; transform: translateX(0) translateY(0); }
}

.error-art {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: $ink-error-light;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28rpx;
}

.error-symbol {
  font-size: 56rpx;
  line-height: 1;
}

.error-content {
  text-align: center;
  margin-bottom: 8rpx;
}

.error-message {
  font-size: $font-base;
  color: $ink-text;
  text-align: center;
  line-height: 1.6;
  max-width: 480rpx;
  font-weight: 500;
}

.error-hint {
  font-size: $font-sm;
  color: $ink-text-secondary;
  text-align: center;
  margin-top: 8rpx;
  display: block;
  max-width: 400rpx;
}

// ── 重试按钮 ──
.retry-btn-wrap {
  margin-top: 40rpx;
}

.retry-btn {
  padding: 0 44rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 2rpx solid $ink-primary;
  border-radius: $radius-full;
}

.retry-text {
  font-size: $font-md;
  color: $ink-primary;
  font-weight: 500;
  line-height: 1;
}
</style>
