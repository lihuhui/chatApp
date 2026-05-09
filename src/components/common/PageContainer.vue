<template>
  <view class="ai-page-container" :class="{ 'has-safe-area': safeArea }">
    <!-- 状态栏占位（App端） -->
    <view v-if="safeArea" class="status-bar" />

    <!-- 导航栏 -->
    <view v-if="showBack || title" class="page-nav">
      <view v-if="showBack" class="nav-back" @click="onBack">
        <view class="nav-back-icon">
          <view class="arrow-shaft" />
          <view class="arrow-head" />
        </view>
        <text class="nav-back-label">返回</text>
      </view>
      <text class="nav-title">{{ title }}</text>
      <!-- 占位保持标题居中 -->
      <view class="nav-right" />
    </view>

    <!-- 内容 -->
    <view class="page-body">
      <slot />
    </view>
  </view>
</template>

<script>
export default {
  props: {
    title: { type: String, default: '' },
    showBack: { type: Boolean, default: true },
    safeArea: { type: Boolean, default: true }
  },
  methods: {
    onBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-page-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: $ink-bg;
}

.has-safe-area {
  padding-bottom: env(safe-area-inset-bottom);
}

.status-bar {
  height: var(--status-bar-height, 44rpx);
  flex-shrink: 0;
}

// === 导航栏 ===
.page-nav {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 $spacing-lg;
  background: $ink-surface;
  flex-shrink: 0;
  position: relative;
  // 底部细线
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1rpx;
    background: $ink-border;
    transform: scaleY(0.5);
  }
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 6rpx;
  z-index: 1;
  padding: 12rpx 0;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:active {
    opacity: 0.6;
  }
}

.nav-back-icon {
  width: 28rpx;
  height: 28rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-shaft {
  position: absolute;
  width: 16rpx;
  height: 2rpx;
  background: $ink-text;
  transform: rotate(-45deg);
  left: 2rpx;
  top: 50%;
  margin-top: -2rpx;
  border-radius: 1rpx;
}

.arrow-head {
  position: absolute;
  width: 16rpx;
  height: 2rpx;
  background: $ink-text;
  transform: rotate(45deg);
  left: 2rpx;
  top: 50%;
  margin-top: 0;
  border-radius: 1rpx;
}

.nav-back-label {
  font-size: $font-base;
  color: $ink-text;
  letter-spacing: 0.3px;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: $font-lg;
  font-weight: 600;
  color: $ink-text;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.nav-right {
  width: 100rpx;
  margin-left: auto;
  flex-shrink: 0;
}

// === 内容 ===
.page-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
