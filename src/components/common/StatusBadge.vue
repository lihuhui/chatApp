<template>
  <view class="ai-status-badge" :class="'badge-' + status">
    <view class="badge-dot" />
    <text class="badge-label">{{ labelMap[status] || status }}</text>
  </view>
</template>

<script>
const labelMap = {
  syncing: '同步中',
  online: '在线',
  offline: '离线',
  error: '异常'
}

export default {
  props: {
    status: { type: String, default: 'offline' }
  },
  setup() {
    return { labelMap }
  }
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 18rpx 6rpx 14rpx;
  border-radius: $radius-full;
  gap: 8rpx;
}

.badge-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.badge-label {
  font-size: $font-xs;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.badge-syncing {
  background: #E3F0FF;
  .badge-dot { background: #2970FF; animation: badgePulse 1.2s ease-in-out infinite; }
  .badge-label { color: #2970FF; }
}

.badge-online {
  background: $ink-success-light;
  .badge-dot { background: $ink-success; }
  .badge-label { color: $ink-primary-dark; }
}

.badge-offline {
  background: $ink-bg;
  .badge-dot { background: $ink-text-tertiary; }
  .badge-label { color: $ink-text-tertiary; }
}

.badge-error {
  background: $ink-error-light;
  .badge-dot { background: $ink-error; }
  .badge-label { color: $ink-error; }
}

@keyframes badgePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
</style>
