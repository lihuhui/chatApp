<template>
  <view class="page">
    <view class="demo-banner">
      <text class="demo-title">示例角色 · 小明</text>
      <text class="demo-desc">一个幽默风趣的程序员，喜欢用表情包</text>
    </view>

    <ChatMessageList
      :messages="chatStore.messages"
      :typing="chatStore.isTyping"
    />

    <!-- 已达上限 -->
    <view v-if="chatStore.isMaxRound" class="round-limit-bar">
      <view class="limit-icon">📋</view>
      <text class="limit-text">已达 30 轮对话上限</text>
      <text class="limit-sub">本次示例对话已结束，你可以：</text>
      <view class="limit-actions">
        <view class="limit-btn" @click="newSession">
          <text class="limit-btn-icon">🔄</text>
          <text>重新开始</text>
        </view>
        <view class="limit-btn" @click="goDownload">
          <text class="limit-btn-icon">📥</text>
          <text>下载 App</text>
        </view>
        <view class="limit-btn" @click="goHome">
          <text class="limit-btn-icon">🏠</text>
          <text>返回首页</text>
        </view>
      </view>
    </view>

    <ChatInput
      v-else
      :disabled="chatStore.isMaxRound"
      placeholder="输入消息..."
      @send="onSend"
    />
    <RoundCounter
      v-if="chatStore.currentSession"
      :current="chatStore.roundCount"
      :max="30"
    />

    <!-- #ifdef MP-WEIXIN -->
    <view class="download-bar press-scale" @click="goDownload">
      <text class="dl-text">💡 下载 App 体验完整功能</text>
    </view>
    <!-- #endif -->
  </view>
</template>

<script>
import { onShow } from '@dcloudio/uni-app'
import { useChatStore } from '@/store'
import ChatMessageList from '@/components/business/ChatMessageList.vue'
import ChatInput from '@/components/business/ChatInput.vue'
import RoundCounter from '@/components/common/RoundCounter.vue'

export default {
  components: { ChatMessageList, ChatInput, RoundCounter },
  setup() {
    const chatStore = useChatStore()

    onShow(() => {
      if (!chatStore.currentSessionId) {
        chatStore.createSession('demo', '小明')
        chatStore.addReply('你好！我是小明，一个程序员。有什么想问的吗？')
      }
    })

    async function onSend(text) {
      if (chatStore.isMaxRound) return
      const userMsg = chatStore.addUserMessage(text)
      chatStore.setTyping(true)

      setTimeout(() => {
        chatStore.updateMessageState(userMsg.id, 'sent')
        chatStore.addReply(`哈哈，关于"${text.slice(0, 10)}"... 我觉得挺有意思的。`, 50)
        chatStore.incrementRound()
        chatStore.setTyping(false)
      }, 800)
    }

    function newSession() {
      chatStore.createSession('demo', '小明')
    }

    function goHome() {
      uni.switchTab({ url: '/pages/index/index' })
    }

    function goDownload() {
      uni.navigateTo({ url: '/pages/download/index' })
    }

    return { chatStore, onSend, newSession, goHome, goDownload }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.page { display: flex; flex-direction: column; height: 100vh; background: $ink-bg; }

.demo-banner {
  background: linear-gradient(135deg, $ink-primary, #3AAFA0);
  padding: 36rpx 30rpx;
  text-align: center;
  position: relative;
  overflow: hidden;

  // 装饰性圆点
  &::before {
    content: '';
    position: absolute;
    top: -30rpx; right: -30rpx;
    width: 120rpx; height: 120rpx;
    background: rgba(255,255,255,0.06);
    border-radius: 50%;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -40rpx; left: -20rpx;
    width: 80rpx; height: 80rpx;
    background: rgba(255,255,255,0.04);
    border-radius: 50%;
  }
}

.demo-title {
  font-size: $font-lg;
  font-weight: 700;
  color: #fff;
  display: block;
  letter-spacing: 1rpx;
  position: relative;
  z-index: 1;
}

.demo-desc {
  font-size: $font-sm;
  color: rgba(255,255,255,0.8);
  margin-top: 8rpx;
  display: block;
  position: relative;
  z-index: 1;
}

.download-bar {
  padding: 20rpx 30rpx;
  text-align: center;
  background: $ink-surface;
  border-top: 1rpx solid $ink-border;
  font-size: $font-sm;
  color: $ink-text-secondary;

  &:active {
    background: $ink-primary-light;
  }

  .dl-text {
    display: block;
  }
}

// ── 对话上限面板 ──
.round-limit-bar {
  background: $ink-surface;
  padding: 32rpx 40rpx;
  text-align: center;
  border-top: 1rpx solid $ink-border;
  animation: limitSlideUp 0.35s $ease-out both;
}

@keyframes limitSlideUp {
  from { transform: translateY(30rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.limit-icon {
  font-size: 64rpx;
  margin-bottom: 12rpx;
}

.limit-text {
  font-size: $font-lg;
  font-weight: 700;
  color: $ink-coral;
  display: block;
}

.limit-sub {
  font-size: $font-sm;
  color: $ink-text-secondary;
  display: block;
  margin: 8rpx 0 24rpx;
}

.limit-actions {
  display: flex;
  gap: 20rpx;
  justify-content: center;
}

.limit-btn {
  flex: 1;
  max-width: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx 12rpx;
  background: $ink-bg;
  border-radius: $radius-md;
  border: 1rpx solid $ink-border;
  font-size: $font-sm;
  color: $ink-text;
  transition: all $transition-fast;

  &:active {
    background: $ink-primary-light;
    border-color: $ink-primary;
    transform: scale(0.95);
  }
}

.limit-btn-icon {
  font-size: 32rpx;
}
</style>
