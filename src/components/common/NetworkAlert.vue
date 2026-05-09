<template>
  <view
    v-if="visible"
    class="ai-network-alert"
    :class="'alert-' + type"
  >
    <view class="alert-indicator" />
    <text class="alert-message">{{ message }}</text>
  </view>
</template>

<script>
export default {
  props: {
    type: { type: String, default: 'warning' },
    message: { type: String, default: '网络连接异常，部分功能可能不可用' },
    visible: { type: Boolean, default: false }
  }
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-network-alert {
  display: flex;
  align-items: center;
  padding: 18rpx 24rpx;
  font-size: $font-sm;
  line-height: 1.4;
  gap: 14rpx;
  overflow: hidden;

  // 滑入动画
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
  }
  to {
    max-height: 120rpx;
    padding-top: 18rpx;
    padding-bottom: 18rpx;
    opacity: 1;
  }
}

.alert-indicator {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  flex-shrink: 0;
  animation: alertPulse 1.5s ease-in-out infinite;
}

@keyframes alertPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.alert-message {
  flex: 1;
  letter-spacing: 0.3px;
}

// === warning ===
.alert-warning {
  background: $ink-warning-light;
  color: #B89440;

  .alert-indicator {
    background: $ink-warning;
  }
}

// === error ===
.alert-error {
  background: $ink-error-light;
  color: $ink-error;

  .alert-indicator {
    background: $ink-error;
  }
}
</style>
