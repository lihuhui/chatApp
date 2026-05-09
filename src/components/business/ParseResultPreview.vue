<template>
  <!-- #ifdef APP-PLUS -->
  <view class="ai-parse-result-preview">
    <view class="preview-stat">
      <text class="stat-number">{{ speakerCount }}</text>
      <text class="stat-label">说话人</text>
    </view>
    <view class="preview-divider" />
    <view class="preview-stat">
      <text class="stat-number">{{ messageCount }}</text>
      <text class="stat-label">消息</text>
    </view>
    <view class="preview-divider" />
    <view class="preview-stat">
      <text class="stat-number">{{ filteredCount }}</text>
      <text class="stat-label">已过滤</text>
    </view>
  </view>
  <!-- #endif -->
</template>

<script>
export default {
  props: {
    speakerCount: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    filteredCount: { type: Number, default: 0 }
  }
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-parse-result-preview {
  display: flex;
  align-items: center;
  background: $ink-surface;
  border-radius: $radius-md;
  padding: 32rpx 24rpx;
  box-shadow: $shadow-sm;
}

.preview-stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.stat-number {
  font-size: $font-xxl;
  font-weight: 700;
  color: $ink-primary;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: $font-xs;
  color: $ink-text-tertiary;
  letter-spacing: 0.5px;
}

.preview-divider {
  width: 1rpx;
  height: 48rpx;
  background: $ink-border;
}
</style>
