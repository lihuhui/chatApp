<template>
  <view class="ai-progress-bar">
    <view class="progress-track">
      <view
        class="progress-fill"
        :style="{ width: clampedPercent + '%' }"
      />
      <view
        v-if="clampedPercent > 0 && clampedPercent < 100"
        class="progress-glow"
        :style="{ left: clampedPercent + '%' }"
      />
    </view>
    <view class="progress-info">
      <text v-if="text" class="progress-text">{{ text }}</text>
      <text v-else class="progress-text">{{ clampedPercent }}%</text>
    </view>
  </view>
</template>

<script>
import { computed } from 'vue'
export default {
  props: {
    percent: { type: Number, default: 0 },
    text: { type: String, default: '' }
  },
  setup(props) {
    const clampedPercent = computed(() =>
      Math.min(100, Math.max(0, props.percent))
    )
    return { clampedPercent }
  }
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-progress-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-track {
  flex: 1;
  height: 6rpx;
  background: $ink-border;
  border-radius: $radius-full;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: $radius-full;
  background: linear-gradient(90deg, $ink-primary, $ink-accent);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

// 流动光效
.progress-glow {
  position: absolute;
  top: -2rpx;
  width: 20rpx;
  height: 10rpx;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  filter: blur(4rpx);
  transform: translateX(-50%);
  animation: glowMove 1.8s ease-in-out infinite;
}

@keyframes glowMove {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
}

.progress-info {
  flex-shrink: 0;
  min-width: 64rpx;
}

.progress-text {
  font-size: $font-sm;
  color: $ink-text-secondary;
  text-align: right;
  letter-spacing: 0.3px;
  font-variant-numeric: tabular-nums;
}
</style>
