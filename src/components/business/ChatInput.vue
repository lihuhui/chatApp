<template>
  <view class="ai-chat-input" :class="{ 'input-disabled': disabled }">
    <view class="input-wrapper">
      <input
        v-model="text"
        class="input-field"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        :confirm-type="'send'"
        @confirm="onSend"
        @input="onInput"
      />
      <view class="input-actions">
        <button
          class="send-btn"
          :disabled="!text.trim() || disabled || loading"
          :class="{ 'btn-active': text.trim() }"
          @click="onSend"
        >
          <view v-if="loading" class="send-loading" />
          <text v-else class="send-icon">↑</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    disabled: { type: Boolean, default: false },
    placeholder: { type: String, default: '输入消息...' },
    maxLength: { type: Number, default: 2000 },
    loading: { type: Boolean, default: false },
    modelValue: { type: String, default: '' }
  },
  emits: ['send', 'update:modelValue', 'typing'],
  data() {
    return {
      text: this.modelValue
    }
  },
  watch: {
    modelValue(val) { this.text = val }
  },
  methods: {
    onInput(e) {
      this.$emit('update:modelValue', e.detail.value)
    },
    onSend() {
      const msg = this.text.trim()
      if (!msg || this.disabled || this.loading) return
      this.$emit('send', msg)
      this.text = ''
      this.$emit('update:modelValue', '')
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-chat-input {
  background: $ink-surface;
  border-top: 1rpx solid $ink-border;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  transition: opacity $transition-fast;
}

.input-disabled {
  opacity: 0.4;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: $ink-bg;
  border-radius: $radius-full;
  padding: 4rpx 4rpx 4rpx 28rpx;
  border: 2rpx solid transparent;
  transition: border-color $transition-fast, box-shadow $transition-fast;
}

// 聚焦态：墨玉青光晕
.input-wrapper:focus-within {
  border-color: $ink-primary;
  box-shadow: 0 0 0 4rpx rgba(42, 157, 143, 0.15);
}

.input-field {
  flex: 1;
  height: 68rpx;
  font-size: $font-base;
  color: $ink-text;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: $ink-text-tertiary;
  }
}

.input-actions {
  flex-shrink: 0;
}

.send-btn {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $ink-border;
  padding: 0;
  border: none;
  transition: all $transition-fast;

  &.btn-active {
    background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);

    .send-icon {
      color: #fff;
    }
  }

  &[disabled] {
    opacity: 1;
  }

  // 发送按钮按下弹跳
  &:not([disabled]):active {
    transform: scale(0.88);
  }
}

.send-icon {
  font-size: 36rpx;
  color: $ink-text-tertiary;
  font-weight: 700;
  line-height: 1;
  transition: transform $transition-fast;
}

.btn-active .send-icon {
  animation: sendPop 0.3s $ease-out;
}

@keyframes sendPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.25); }
  100% { transform: scale(1); }
}

.send-loading {
  width: 24rpx;
  height: 24rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
