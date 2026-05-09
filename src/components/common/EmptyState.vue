<template>
  <view class="ai-empty" :class="'empty-' + (type || 'default')">
    <view class="empty-art">
      <text class="empty-icon">{{ icon }}</text>
    </view>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
    <view v-if="actionText" class="empty-btn-wrap press-scale" @click="$emit('action')">
      <view class="empty-btn">
        <text class="empty-btn-text">{{ actionText }}</text>
        <text class="empty-btn-arrow">→</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    icon: { type: String, default: '📭' },
    title: { type: String, default: '暂无内容' },
    description: { type: String, default: '' },
    actionText: { type: String, default: '' },
    type: { type: String, default: 'default' }
  },
  emits: ['action']
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 60rpx;
  animation: emptyEnter 0.5s $ease-out both;
}

@keyframes emptyEnter {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.empty-art {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $ink-primary-light, #F0F7F5);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
  box-shadow: inset 0 -2rpx 4rpx rgba(42, 157, 143, 0.06);
}

.empty-icon {
  font-size: 72rpx;
  line-height: 1;
}

.empty-title {
  font-size: $font-lg;
  color: $ink-text;
  font-weight: 600;
  margin-bottom: 12rpx;
  letter-spacing: 0.3px;
}

.empty-desc {
  font-size: $font-base;
  color: $ink-text-secondary;
  text-align: center;
  line-height: 1.6;
  max-width: 480rpx;
}

// ── 操作按钮 ──
.empty-btn-wrap {
  margin-top: 48rpx;
}

.empty-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 40rpx;
  height: 76rpx;
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  border-radius: $radius-full;
  color: #fff;
  font-size: $font-md;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(42, 157, 143, 0.25);
}

.empty-btn-text {
  line-height: 1;
}

.empty-btn-arrow {
  font-size: 28rpx;
  line-height: 1;
  transition: transform $transition-fast;
}

.empty-btn-wrap:active .empty-btn-arrow {
  transform: translateX(6rpx);
}
</style>
