<template>
  <view class="chat-page">
    <!-- 网络状态提示 -->
    <NetworkAlert
      :visible="!isOnline"
      type="warning"
      message="网络连接异常，AI 回复可能不可用"
    />

    <!-- 无会话 → 空状态 -->
    <template v-if="!currentSession">
      <EmptyState
        icon="💬"
        title="还没有对话"
        description="从角色页或会话列表开始一段对话"
      />
    </template>

    <!-- 有会话 → 聊天界面 -->
    <template v-else>
      <ChatMessageList
        :messages="messages"
        :loading="loading"
        :typing="isTyping"
        :has-more="chat.hasMore"
        @loadMore="onLoadMore"
      />

      <!-- 已达上限 -->
      <view v-if="isMaxRound" class="round-limit-bar">
        <view class="limit-icon">📋</view>
        <text class="limit-text">已达 30 轮对话上限</text>
        <text class="limit-sub">本次对话已结束，你可以：</text>
        <view class="limit-actions">
          <view class="limit-btn" @click="newSession">
            <text class="limit-btn-icon">🔄</text>
            <text>新对话</text>
          </view>
          <view class="limit-btn" @click="goHistory">
            <text class="limit-btn-icon">📖</text>
            <text>查看历史</text>
          </view>
          <view class="limit-btn" @click="goRole">
            <text class="limit-btn-icon">🏠</text>
            <text>返回首页</text>
          </view>
        </view>
      </view>

      <!-- 输入框 -->
      <ChatInput
        v-else
        :disabled="!currentSession"
        :loading="isTyping"
        placeholder="输入消息..."
        @send="onSend"
      />

      <!-- 轮数指示器 -->
      <RoundCounter v-if="currentSession" :current="roundCount" :max="30" />
    </template>
  </view>
</template>

<script>
import { ref } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { useChatStore, useRoleStore } from '@/store'
import { generateReply } from '@/api/chat'
import ChatMessageList from '@/components/business/ChatMessageList.vue'
import ChatInput from '@/components/business/ChatInput.vue'
import RoundCounter from '@/components/common/RoundCounter.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import NetworkAlert from '@/components/common/NetworkAlert.vue'

export default {
  components: { ChatMessageList, ChatInput, RoundCounter, EmptyState, NetworkAlert },
  setup() {
    const chat = useChatStore()
    const roleStore = useRoleStore()
    const { messages, loading, isTyping, isMaxRound, roundCount, currentSession } = storeToRefs(chat)

    // 网络状态
    const isOnline = ref(true)

    onShow(() => {
      if (!chat.currentSessionId && chat.sessions.length > 0) {
        chat.switchSession(chat.sessions[0].id)
      }
      // 监听网络状态
      uni.getNetworkType({
        success: (res) => {
          isOnline.value = res.networkType !== 'none'
        }
      })
      uni.onNetworkStatusChange(onNetworkChange)
    })

    function onNetworkChange(res) {
      isOnline.value = res.isConnected
    }

    onHide(() => {
      uni.offNetworkStatusChange(onNetworkChange)
    })

    async function onSend(text) {
      if (chat.isMaxRound) return
      const userMsg = chat.addUserMessage(text)
      chat.setTyping(true)

      try {
        const styleReport = roleStore.currentRole?.styleReport || null
        const sessionId = chat.currentSessionId || ''
        const contextMessages = chat.messages.slice(-20).map(m => ({
          sender: m.sender === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
        const result = await generateReply(sessionId, text, styleReport, {
          roleName: chat.currentSession?.roleName || '',
          contextMessages
        })
        chat.addReply(result.content, result.content.length)
        chat.updateMessageState(userMsg.id, 'sent')
        chat.incrementRound()
      } catch (err) {
        chat.updateMessageState(userMsg.id, 'failed')
        uni.showToast({
          title: err.message?.includes('降级') ? '已使用本地回复' : '回复失败，请重试',
          icon: 'none',
          duration: 2000
        })
      } finally {
        chat.setTyping(false)
      }
    }

    function onLoadMore() {
      const sessionId = chat.currentSessionId
      if (sessionId) {
        chat.loadHistoryMessages(sessionId)
      }
    }

    function newSession() {
      if (chat.currentSession) {
        chat.createSession(chat.currentSession.roleId, chat.currentSession.roleName)
      }
    }

    function goHistory() {
      uni.navigateTo({ url: '/pages/chat/history' })
    }

    function goRole() {
      uni.switchTab({ url: '/pages/index/index' })
    }

    return {
      messages, loading, isTyping, isMaxRound, roundCount, currentSession, isOnline, chat,
      onSend, onLoadMore, newSession, goHistory, goRole
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $ink-bg;
  animation: chatEnter 0.4s $ease-out both;
}

@keyframes chatEnter {
  from { opacity: 0; }
  to { opacity: 1; }
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
