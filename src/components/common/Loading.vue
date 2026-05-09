<template>
  <view class="ai-loading" :class="'loading-' + type">
    <!-- 转圈 -->
    <view v-if="type === 'spinner'" class="spinner-ring">
      <view class="spinner-circle" />
    </view>

    <!-- 弹性跳点 -->
    <view v-else-if="type === 'dots'" class="dots-row">
      <view
        v-for="i in 3"
        :key="i"
        class="dot"
        :style="{ animationDelay: (i - 1) * 0.18 + 's' }"
      />
    </view>

    <!-- 骨架块：传入 skeleton-count 指定块数 -->
    <view v-else-if="type === 'skeleton'" class="skeleton-group">
      <view
        v-for="i in (skeletonCount || 3)"
        :key="i"
        class="skeleton-block"
        :style="skeletonStyle(i)"
      />
    </view>

    <!-- 骨架消息列表（模仿聊天气泡布局） -->
    <view v-else-if="type === 'skeleton-chat'" class="skeleton-chat">
      <view
        v-for="i in (skeletonCount || 4)"
        :key="i"
        class="skeleton-msg"
        :class="i % 2 === 0 ? 'skeleton-self' : 'skeleton-other'"
      >
        <view class="skeleton-avatar" />
        <view class="skeleton-bubble" />
      </view>
    </view>

    <text v-if="text" class="loading-text">{{ text }}</text>
  </view>
</template>

<script>
export default {
  props: {
    text: { type: String, default: '' },
    type: { type: String, default: 'spinner' },
    skeletonCount: { type: Number, default: 3 },
    skeletonWidths: { type: Array, default: () => ['60%', '45%', '70%', '35%'] }
  },
  methods: {
    skeletonStyle(i) {
      const widths = this.skeletonWidths
      const w = widths[(i - 1) % widths.length]
      const h = 24 + (i % 3) * 8
      return {
        width: w,
        height: h + 'rpx',
        animationDelay: (i - 1) * 0.1 + 's'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  gap: 24rpx;
}

// === 转圈 ===
.spinner-ring {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-circle {
  width: 56rpx;
  height: 56rpx;
  border: 4rpx solid $ink-border;
  border-top-color: $ink-primary;
  border-radius: 50%;
  animation: spin 0.7s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// === 跳点 ===
.dots-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.dot {
  width: 14rpx;
  height: 14rpx;
  background: $ink-primary;
  border-radius: 50%;
  animation: dotBounce 1.2s ease-in-out infinite;
}

@keyframes dotBounce {
  0%, 80%, 100% {
    transform: scale(0.5);
    opacity: 0.3;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.loading-text {
  font-size: $font-sm;
  color: $ink-text-tertiary;
  letter-spacing: 0.5px;
}

// === 骨架块（通用） ===
.skeleton-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  width: 100%;
  padding: 0 30rpx;
}

.skeleton-block {
  background: $skeleton-shimmer;
  background-size: 400% 100%;
  border-radius: $radius-sm;
  animation: skeletonShimmer 1.5s ease infinite;
}

// === 骨架聊天消息 ===
.skeleton-chat {
  display: flex;
  flex-direction: column;
  gap: 28rpx;
  padding: 20rpx 30rpx;
  width: 100%;
}

.skeleton-msg {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.skeleton-self {
  flex-direction: row-reverse;

  .skeleton-bubble {
    background: $skeleton-shimmer;
    background-size: 400% 100%;
    height: 64rpx;
    width: 55%;
    border-radius: $radius-lg $radius-sm $radius-lg $radius-lg;
    animation: skeletonShimmer 1.5s ease infinite;
  }
}

.skeleton-other {
  flex-direction: row;

  .skeleton-bubble {
    background: $skeleton-shimmer;
    background-size: 400% 100%;
    height: 72rpx;
    width: 60%;
    border-radius: $radius-sm $radius-lg $radius-lg $radius-lg;
    animation: skeletonShimmer 1.5s ease infinite;
  }
}

.skeleton-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: $skeleton-shimmer;
  background-size: 400% 100%;
  flex-shrink: 0;
  animation: skeletonShimmer 1.5s ease infinite;
}

@keyframes skeletonShimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}
</style>
