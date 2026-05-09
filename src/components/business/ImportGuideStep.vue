<template>
  <!-- #ifdef APP-PLUS -->
  <view class="ai-import-guide-step">
    <view class="step-indicator">
      <view class="step-number">
        <text>{{ stepIndex }}</text>
      </view>
      <view v-if="stepIndex < totalSteps" class="step-line" />
    </view>
    <view class="step-content">
      <view class="step-header">
        <text class="step-platform">{{ platformText }}</text>
        <text class="step-title">{{ title }}</text>
      </view>
      <text class="step-text">{{ text }}</text>
      <image v-if="image" class="step-image" :src="image" mode="widthFix" />
    </view>
  </view>
  <!-- #endif -->
</template>

<script>
const platformNames = {
  ios: 'iOS',
  android: 'Android',
  pc: 'PC 端'
}

export default {
  props: {
    platform: { type: String, default: 'ios' }, // ios / android / pc
    stepIndex: { type: Number, default: 1 },
    totalSteps: { type: Number, default: 3 },
    title: { type: String, default: '' },
    image: { type: String, default: '' },
    text: { type: String, default: '' }
  },
  computed: {
    platformText() {
      return platformNames[this.platform] || this.platform
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-import-guide-step {
  display: flex;
  gap: 24rpx;
  padding: 0 24rpx;
}

.step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 48rpx;
  flex-shrink: 0;
}

.step-number {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: $ink-primary;
  display: flex;
  align-items: center;
  justify-content: center;

  text {
    font-size: $font-sm;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }
}

.step-line {
  width: 2rpx;
  flex: 1;
  background: $ink-border;
  margin: 8rpx 0;
}

.step-content {
  flex: 1;
  padding-bottom: 48rpx;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.step-platform {
  font-size: $font-xs;
  font-weight: 600;
  color: $ink-primary-dark;
  background: $ink-primary-light;
  padding: 2rpx 14rpx;
  border-radius: $radius-full;
  letter-spacing: 0.3px;
}

.step-title {
  font-size: $font-base;
  font-weight: 500;
  color: $ink-text;
}

.step-text {
  display: block;
  font-size: $font-sm;
  color: $ink-text-secondary;
  line-height: 1.6;
  margin-bottom: 16rpx;
  padding-right: 20rpx;
}

.step-image {
  width: 100%;
  max-width: 500rpx;
  border-radius: $radius-sm;
  border: 1rpx solid $ink-border;
}
</style>
