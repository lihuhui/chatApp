<template>
  <view class="ai-avatar" :class="status" :style="{ width: size + 'rpx', height: size + 'rpx' }">
    <!-- 加载骨架 -->
    <view v-if="status === 'loading'" class="avatar-shimmer" />
    <!-- 图片 -->
    <image
      v-else-if="status === 'loaded' && src"
      class="avatar-img"
      :src="src"
      :style="{ width: size + 'rpx', height: size + 'rpx' }"
      mode="aspectFill"
      @load="status = 'loaded'"
      @error="status = 'error'"
    />
    <!-- 首字占位 -->
    <view v-else class="avatar-placeholder" :style="{ width: size + 'rpx', height: size + 'rpx', fontSize: (size * 0.38) + 'rpx' }">
      <text>{{ initial }}</text>
    </view>
    <!-- 名字标签 -->
    <text v-if="showName && name" class="avatar-name">{{ name }}</text>
  </view>
</template>

<script>
import { ref, computed } from 'vue'
export default {
  props: {
    src: { type: String, default: '' },
    size: { type: Number, default: 80 },
    name: { type: String, default: '' },
    showName: { type: Boolean, default: false }
  },
  setup(props) {
    const status = ref(props.src ? 'loading' : '')
    const initial = computed(() => props.name ? props.name.charAt(0) : '?')
    return { status, initial }
  }
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: $ink-primary-light;
  vertical-align: middle;

  // 加载完成 — 加一道淡光晕
  &.loaded {
    box-shadow: 0 0 0 2rpx rgba($ink-primary, 0.1);
  }
}

.avatar-shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    $ink-border 25%,
    $ink-bg 50%,
    $ink-border 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.avatar-img {
  display: block;
  border-radius: 50%;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  color: #fff;
  font-weight: 600;
  border-radius: 50%;

  text {
    line-height: 1;
    letter-spacing: 0;
  }
}

.avatar-name {
  position: absolute;
  bottom: -4rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: $font-xs;
  color: $ink-text-secondary;
  white-space: nowrap;
  max-width: 3em;
  overflow: hidden;
  text-overflow: ellipsis;
}

// 错误状态 — 虚边提示
.ai-avatar.error {
  box-shadow: 0 0 0 2rpx $ink-error;
}
</style>
