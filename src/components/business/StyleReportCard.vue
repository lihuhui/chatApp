<template>
  <!-- #ifdef APP-PLUS -->
  <view class="ai-style-report-card">
    <view class="report-header">
      <text class="report-dimension">{{ dimension }}</text>
      <view class="report-badge">
        <text class="badge-text">{{ value }}</text>
      </view>
    </view>
    <text v-if="detail" class="report-detail">{{ detail }}</text>
  </view>
  <!-- #endif -->
</template>

<script>
export default {
  props: {
    dimension: { type: String, default: '' },
    value: { type: String, default: '' },
    detail: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-style-report-card {
  background: $ink-surface;
  border-radius: $radius-md;
  padding: 28rpx 24rpx;
  box-shadow: $shadow-sm;
  border-left: 6rpx solid $ink-primary;
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.report-dimension {
  font-size: $font-md;
  font-weight: 600;
  color: $ink-text;
  letter-spacing: 0.3px;
}

.report-badge {
  padding: 4rpx 18rpx;
  background: $ink-primary-light;
  border-radius: $radius-full;
}

.badge-text {
  font-size: $font-sm;
  font-weight: 500;
  color: $ink-primary-dark;
  letter-spacing: 0.3px;
}

.report-detail {
  display: block;
  font-size: $font-sm;
  color: $ink-text-secondary;
  line-height: 1.6;
  padding-right: 20rpx;
}
</style>
