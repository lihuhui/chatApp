<template>
  <view class="ai-sync-status-bar" :class="'sync-' + status">
    <view class="sync-indicator">
      <view class="sync-dot" />
    </view>
    <text class="sync-label">{{ labelText }}</text>
    <text v-if="lastSyncTime && status !== 'syncing'" class="sync-time">{{ lastSyncTime }}</text>
  </view>
</template>

<script>
const labels = {
  syncing: '同步中...',
  online: '已同步',
  offline: '离线',
  error: '同步异常'
}

export default {
  props: {
    status: { type: String, default: 'offline' }, // syncing / online / offline / error
    lastSyncTime: { type: String, default: '' }
  },
  computed: {
    labelText() {
      return labels[this.status] || this.status
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-sync-status-bar {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  gap: 10rpx;
  font-size: $font-xs;
  background: $ink-bg;
}

.sync-indicator {
  display: flex;
  align-items: center;
}

.sync-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
}

.sync-label {
  color: inherit;
  letter-spacing: 0.3px;
}

.sync-time {
  margin-left: auto;
  color: $ink-text-tertiary;
}

// 各状态
.sync-syncing {
  background: #E3F0FF;
  color: #2970FF;

  .sync-dot {
    background: #2970FF;
    animation: dotPulse 1s ease-in-out infinite;
  }
}

.sync-online {
  background: $ink-success-light;
  color: $ink-primary-dark;

  .sync-dot {
    background: $ink-success;
  }
}

.sync-offline {
  background: $ink-bg;
  color: $ink-text-tertiary;

  .sync-dot {
    background: $ink-text-tertiary;
  }

  .sync-time {
    display: none;
  }
}

.sync-error {
  background: $ink-error-light;
  color: $ink-error;

  .sync-dot {
    background: $ink-error;
  }
}

@keyframes dotPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
