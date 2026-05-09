<template>
  <view class="ai-style-tag" :class="'tag-' + type">
    <text class="tag-text">{{ label }}</text>
  </view>
</template>

<script>
export default {
  props: {
    label: { type: String, default: '' },
    type: { type: String, default: 'default' }
    // type: default / concise / emotional / formal / casual / creative
  }
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-style-tag {
  display: inline-flex;
  padding: 6rpx 18rpx;
  border-radius: $radius-full;
  font-size: $font-xs;
  font-weight: 500;
  letter-spacing: 0.3px;
  line-height: 1.4;
}

// 默认 — 墨玉
.tag-default {
  background: $ink-primary-light;
  color: $ink-primary-dark;
}

// 简洁 — 灰
.tag-concise {
  background: $ink-bg;
  color: $ink-text-secondary;
}

// 感性 — 玫瑰
.tag-emotional {
  background: #FDF0F5;
  color: #C94A7C;
}

// 正式 — 靛蓝
.tag-formal {
  background: #EEF2FF;
  color: #4A6CC9;
}

// 随性 — 琥珀
.tag-casual {
  background: $ink-warning-light;
  color: #A8883C;
}

// 创意 — 珊瑚
.tag-creative {
  background: #FFF0EE;
  color: #C96A4A;
}
</style>
