<template>
  <view class="ai-chat-bubble" :class="['bubble-' + type, bubbleState]">
    <!-- 对方消息：头像 + 昵称 -->
    <view v-if="type === 'received'" class="bubble-avatar">
      <Avatar :src="avatar" :size="72" :name="nickname || sender" />
    </view>

    <view class="bubble-body">
      <text v-if="type === 'received' && nickname" class="bubble-nickname">{{ nickname }}</text>

      <view class="bubble-content" :class="'content-' + type">
        <text class="bubble-text">{{ content }}</text>
      </view>

      <!-- 时间标签 -->
      <text v-if="time" class="bubble-time">{{ time }}</text>
    </view>

    <!-- 自己消息：状态指示 -->
    <view v-if="type === 'sent'" class="bubble-status">
      <view v-if="state === 'sending'" class="status-sending" />
      <text v-else-if="state === 'failed'" class="status-failed">!</text>
    </view>
  </view>
</template>

<script>
import Avatar from '@/components/common/Avatar.vue'

export default {
  components: { Avatar },
  props: {
    content: { type: String, default: '' },
    sender: { type: String, default: '' },
    time: { type: String, default: '' },
    avatar: { type: String, default: '' },
    nickname: { type: String, default: '' },
    type: { type: String, default: 'received' }, // sent / received
    state: { type: String, default: '' }          // '' / sending / failed
  },
  computed: {
    bubbleState() {
      return this.state ? 'state-' + this.state : ''
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-chat-bubble {
  display: flex;
  align-items: flex-start;
  padding: 12rpx 24rpx;
  gap: 16rpx;
  max-width: 100%;

  // 自己发的 — 右对齐
  &.bubble-sent {
    flex-direction: row-reverse;
  }
}

// === 头像 ===
.bubble-avatar {
  flex-shrink: 0;
  padding-top: 6rpx;
}

// === 主体 ===
.bubble-body {
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.bubble-nickname {
  font-size: $font-xs;
  color: $ink-text-secondary;
  padding: 0 8rpx;
}

.bubble-content {
  padding: 20rpx 24rpx;
  border-radius: $radius-lg;
  word-break: break-word;
}

.bubble-text {
  font-size: $font-base;
  line-height: 1.6;
  white-space: pre-wrap;
}

// 对方消息 — 白底，左圆角小
.content-received {
  background: $ink-surface;
  color: $ink-text;
  border-top-left-radius: 4rpx;
  box-shadow: $shadow-sm;
}

// 自己消息 — 墨玉青渐变底，右圆角小
.bubble-sent .content-sent {
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  color: #fff;
  border-top-right-radius: 4rpx;
  box-shadow: 0 2rpx 8rpx rgba(42, 157, 143, 0.25);
}

// 自己消息 — 文字增加字距提升可读性
.bubble-sent .bubble-text {
  letter-spacing: 0.5px;
}

.bubble-time {
  font-size: $font-xs;
  color: $ink-text-tertiary;
  padding: 0 8rpx;
}

// === 状态 ===
.bubble-status {
  flex-shrink: 0;
  width: 36rpx;
  height: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20rpx;
}

.status-sending {
  width: 16rpx;
  height: 16rpx;
  border: 2rpx solid $ink-text-tertiary;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.status-failed {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: $ink-error;
  color: #fff;
  font-size: 18rpx;
  font-weight: 700;
  text-align: center;
  line-height: 32rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// === 发送失败状态 ===
.ai-chat-bubble.state-failed {
  opacity: 0.7;
  animation: shakeX 0.4s ease-in-out;
}

@keyframes shakeX {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8rpx); }
  40% { transform: translateX(8rpx); }
  60% { transform: translateX(-6rpx); }
  80% { transform: translateX(6rpx); }
}
</style>
