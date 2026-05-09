<template>
  <view class="ai-chat-message-list">
    <!-- 顶部加载历史 -->
    <view v-if="loading && messages.length" class="list-loading">
      <Loading type="spinner" text="加载历史消息..." />
    </view>
    <view v-else-if="!hasMore && messages.length" class="list-loading list-nomore">
      <text class="nomore-text">— 没有更多消息了 —</text>
    </view>

    <!-- 首次加载 → 骨架屏 -->
    <Loading v-if="loading && !messages.length" type="skeleton-chat" text="加载中..." />

    <!-- 空状态 -->
    <EmptyState
      v-else-if="!messages.length && !loading"
      icon="💬"
      title="暂无消息"
      description="开始一段对话吧"
    />

    <!-- 消息列表 -->
    <scroll-view
      v-else
      class="list-scroll"
      scroll-y
      :scroll-into-view="scrollTarget"
      :scroll-with-animation="true"
      @scrolltoupper="$emit('loadMore')"
    >
      <view class="list-inner">
        <view
          v-for="(msg, idx) in messages"
          :key="msg.id || idx"
          :id="'msg-' + (msg.id || idx)"
          class="msg-item"
          :style="{ animationDelay: (idx * 0.02) + 's' }"
        >
          <!-- 时间分隔线（第一条或前后时间差 > 5分钟） -->
          <view v-if="showTimeSeparator(idx)" class="time-separator">
            <text class="time-text">{{ formatTime(msg.time) }}</text>
          </view>
          <ChatBubble
            :content="msg.content"
            :sender="msg.sender"
            :time="msg.time"
            :avatar="msg.avatar"
            :nickname="msg.nickname"
            :type="msg.type || 'received'"
            :state="msg.state || ''"
          />
        </view>

        <!-- 对方正在输入 — 自定义暖墨风格指示器 -->
        <view v-if="typing" class="typing-indicator">
          <view class="typing-avatar">
            <Avatar :size="64" />
          </view>
          <view class="typing-content">
            <view class="typing-dots">
              <view class="typing-dot" />
              <view class="typing-dot" />
              <view class="typing-dot" />
            </view>
            <text class="typing-label">对方正在输入…</text>
          </view>
        </view>

        <!-- 底部占位，用于滚动定位 -->
        <view id="msg-bottom" class="list-bottom" />
      </view>
    </scroll-view>
  </view>
</template>

<script>
import Loading from '@/components/common/Loading.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ChatBubble from './ChatBubble.vue'
import Avatar from '@/components/common/Avatar.vue'

export default {
  components: { Loading, EmptyState, ChatBubble, Avatar },
  props: {
    messages: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    typing: { type: Boolean, default: false },
    hasMore: { type: Boolean, default: true }
  },
  emits: ['loadMore'],
  computed: {
    scrollTarget() {
      if (this.typing) return 'msg-bottom'
      const last = this.messages.length
      return last ? 'msg-' + (this.messages[last - 1].id || (last - 1)) : ''
    }
  },
  methods: {
    showTimeSeparator(idx) {
      if (idx === 0) return true
      const prev = this.messages[idx - 1]
      const curr = this.messages[idx]
      if (!prev || !curr) return false
      if (!prev.time || !curr.time) return false
      const diff = new Date(curr.time) - new Date(prev.time)
      return diff > 5 * 60 * 1000
    },
    formatTime(time) {
      if (!time) return ''
      const d = new Date(time)
      const now = new Date()
      const pad = n => String(n).padStart(2, '0')
      const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`

      // 今天
      if (d.toDateString() === now.toDateString()) return hhmm
      // 昨天
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (d.toDateString() === yesterday.toDateString()) return `昨天 ${hhmm}`
      // 今年
      if (d.getFullYear() === now.getFullYear()) {
        return `${d.getMonth() + 1}月${d.getDate()}日 ${hhmm}`
      }
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hhmm}`
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-chat-message-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: $ink-bg;
}

.list-scroll {
  flex: 1;
  height: 0;
}

.list-inner {
  padding: 20rpx 0;
}

.list-loading {
  padding: 20rpx 0;
}

.list-nomore {
  text-align: center;
}

.nomore-text {
  font-size: $font-xs;
  color: $ink-text-tertiary;
}

.time-separator {
  display: flex;
  justify-content: center;
  padding: 20rpx 0 12rpx;
}

.time-text {
  font-size: $font-xs;
  color: $ink-text-tertiary;
  background: rgba(0, 0, 0, 0.04);
  padding: 4rpx 20rpx;
  border-radius: $radius-full;
}

.typing-indicator {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 8rpx 24rpx;
}

.typing-avatar {
  flex-shrink: 0;
  padding-top: 6rpx;
}

.typing-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: $ink-surface;
  padding: 18rpx 24rpx;
  border-radius: 4rpx $radius-lg $radius-lg $radius-lg;
  box-shadow: $shadow-sm;
}

.typing-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: $ink-primary;
  opacity: 0.4;
  animation: typingBreathe 1.4s ease-in-out infinite;

  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes typingBreathe {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: scale(0.7);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
}

.typing-label {
  font-size: $font-xs;
  color: $ink-text-tertiary;
  padding-left: 8rpx;
}

.list-bottom {
  height: 20rpx;
}

// ── 消息入场动画 ──
.msg-item {
  animation: msgFadeIn 0.3s ease-out both;
}

@keyframes msgFadeIn {
  from {
    opacity: 0;
    transform: translateY(16rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
