<template>
  <view class="ai-round-counter" :class="stateClass">
    <view class="counter-track">
      <view class="counter-fill" :style="{ width: fillPercent + '%' }" />
    </view>
    <view class="counter-info">
      <text class="counter-current">{{ current }}</text>
      <text class="counter-sep">/</text>
      <text class="counter-max">{{ max }}</text>
    </view>
    <text v-if="stateLabel" class="counter-label">{{ stateLabel }}</text>
  </view>
</template>

<script>
import { computed } from 'vue'
export default {
  props: {
    current: { type: Number, default: 0 },
    max: { type: Number, default: 30 }
  },
  setup(props) {
    const fillPercent = computed(() =>
      Math.min(100, (props.current / props.max) * 100)
    )

    const stateClass = computed(() => {
      if (props.current >= props.max) return 'state-reached'
      if (props.current >= props.max - 5) return 'state-warning'
      return 'state-normal'
    })

    const stateLabel = computed(() => {
      if (props.current >= props.max) return '已达上限'
      if (props.current >= props.max - 5) return '即将达限'
      return ''
    })

    return { fillPercent, stateClass, stateLabel }
  }
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-round-counter {
  padding: 20rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.counter-track {
  flex: 1;
  height: 8rpx;
  background: rgba(0, 0, 0, 0.08);
  border-radius: $radius-full;
  overflow: hidden;
}

.counter-fill {
  height: 100%;
  border-radius: $radius-full;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.counter-info {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  flex-shrink: 0;
}

.counter-current {
  font-size: $font-lg;
  font-weight: 700;
  line-height: 1;
}

.counter-sep {
  font-size: $font-sm;
  color: inherit;
  opacity: 0.4;
}

.counter-max {
  font-size: $font-sm;
  color: inherit;
  opacity: 0.6;
}

.counter-label {
  font-size: $font-xs;
  flex-shrink: 0;
  white-space: nowrap;
}

// === states ===
.state-normal {
  background: $ink-success-light;

  .counter-fill { background: $ink-success; }
  .counter-current { color: $ink-primary-dark; }
  .counter-max { color: $ink-text-secondary; }
}

.state-warning {
  background: $ink-warning-light;

  .counter-fill { background: $ink-warning; }
  .counter-current { color: #A07F30; }
  .counter-max { color: $ink-text-secondary; }
  .counter-label { color: $ink-warning; }
}

.state-reached {
  background: $ink-error-light;

  .counter-fill { background: $ink-error; width: 100% !important; }
  .counter-current { color: $ink-error; }
  .counter-max { color: $ink-text-secondary; }
  .counter-label { color: $ink-error; }
}
</style>
