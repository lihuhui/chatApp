<template>
  <view class="ai-session-card" hover-class="card-hover" @click="$emit('click')">
    <view class="card-body">
      <view class="card-top">
        <text class="card-title">{{ title }}</text>
        <StatusBadge v-if="status" :status="status" />
      </view>
      <view class="card-meta">
        <text class="meta-round">{{ roundCount }} 轮</text>
        <text class="meta-sep">·</text>
        <text class="meta-time">{{ formattedTime }}</text>
      </view>
    </view>
    <view class="card-arrow">
      <text class="arrow-icon">›</text>
    </view>
  </view>
</template>

<script>
import StatusBadge from '@/components/common/StatusBadge.vue'

export default {
  components: { StatusBadge },
  props: {
    title: { type: String, default: '' },
    roundCount: { type: Number, default: 0 },
    lastTime: { type: String, default: '' },
    status: { type: String, default: '' }
  },
  emits: ['click'],
  computed: {
    formattedTime() {
      if (!this.lastTime) return ''
      const d = new Date(this.lastTime)
      const now = new Date()
      const pad = n => String(n).padStart(2, '0')

      // 今天
      if (d.toDateString() === now.toDateString()) {
        return `今天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      // 昨天
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (d.toDateString() === yesterday.toDateString()) {
        return `昨天 ${pad(d.getHours())}:${pad(d.getMinutes())}`
      }
      return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '../common/variables' as *;

.ai-session-card {
  display: flex;
  align-items: center;
  padding: 28rpx 24rpx;
  background: $ink-surface;
  border-radius: $radius-md;
  gap: 12rpx;
  border-left: 6rpx solid $ink-accent;
  transition: all $transition-fast;
  box-shadow: $shadow-sm;

  &.card-hover {
    background: $ink-warning-light;
    border-left-color: color.adjust(#E9C46A, $lightness: -10%);
    transform: scale(0.98);
  }
}

.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.card-title {
  font-size: $font-md;
  font-weight: 600;
  color: $ink-text;
  letter-spacing: 0.3px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.meta-round {
  font-size: $font-sm;
  color: $ink-primary;
  font-weight: 500;
}

.meta-sep {
  font-size: $font-sm;
  color: $ink-text-tertiary;
}

.meta-time {
  font-size: $font-sm;
  color: $ink-text-tertiary;
}

.card-arrow {
  flex-shrink: 0;
  width: 40rpx;
  display: flex;
  justify-content: center;
}

.arrow-icon {
  font-size: 40rpx;
  color: $ink-text-tertiary;
  line-height: 1;
}
</style>
