<template>
  <view v-if="visible" class="ai-confirm-overlay" @touchmove.prevent.stop>
    <view class="ai-confirm-dialog" @tap.stop>
      <view class="dialog-header">
        <text class="dialog-title">{{ title }}</text>
      </view>
      <text class="dialog-message">{{ message }}</text>
      <view class="dialog-actions" :class="{ 'single-btn': !cancelText }">
        <button
          v-if="cancelText"
          class="dialog-btn btn-cancel"
          hover-class="btn-hover"
          @click="$emit('cancel')"
        >{{ cancelText }}</button>
        <button
          class="dialog-btn btn-confirm"
          :class="{ 'btn-danger': danger }"
          hover-class="btn-hover"
          @click="$emit('confirm')"
        >{{ confirmText }}</button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '提示' },
    message: { type: String, default: '' },
    confirmText: { type: String, default: '确定' },
    cancelText: { type: String, default: '取消' },
    danger: { type: Boolean, default: false }
  },
  emits: ['confirm', 'cancel']
}
</script>

<style lang="scss" scoped>
@use './variables' as *;

.ai-confirm-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(29, 29, 31, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.ai-confirm-dialog {
  width: 560rpx;
  background: $ink-surface;
  border-radius: $radius-lg;
  padding: 36rpx 32rpx 28rpx;
  box-sizing: border-box;
  box-shadow: $shadow-lg;
  animation: dialogIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes dialogIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  margin-bottom: 12rpx;
}

.dialog-title {
  display: block;
  font-size: $font-lg;
  font-weight: 600;
  color: $ink-text;
  text-align: center;
  letter-spacing: 0.3px;
}

.dialog-message {
  display: block;
  font-size: $font-base;
  color: $ink-text-secondary;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 36rpx;
  padding: 0 12rpx;
}

.dialog-actions {
  display: flex;
  gap: 20rpx;

  &.single-btn {
    justify-content: center;
  }
}

.dialog-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: $radius-md;
  font-size: $font-md;
  text-align: center;
  font-weight: 500;
  padding: 0;
  border: none;
  transition: opacity $transition-fast;
}

.btn-hover {
  opacity: 0.8;
}

.btn-cancel {
  background: $ink-bg;
  color: $ink-text-secondary;
}

.btn-confirm {
  background: $ink-primary;
  color: #fff;

  &.btn-danger {
    background: $ink-error;
  }
}
</style>
