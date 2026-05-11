<template>
  <view class="chat-page">
    <!-- 网络状态提示 -->
    <NetworkAlert
      :visible="!isOnline"
      type="warning"
      message="网络连接异常，AI 回复可能不可用"
    />

    <!-- 无会话 → 起始页（可滚动） -->
    <scroll-view v-if="!currentSession" class="no-session-scroll" scroll-y>
      <!-- 有历史会话 → 继续对话 -->
      <template v-if="savedSessions.length">
        <view class="welcome-header">
          <text class="welcome-title">继续对话</text>
        </view>
        <view class="session-list">
          <SessionCard
            v-for="s in savedSessions"
            :key="s.id"
            :title="s.roleName"
            :round-count="s.roundCount"
            :last-time="s.lastTime"
            :status="s.status"
            @click="resumeSession(s)"
          />
        </view>
        <view class="divider">
          <text class="divider-text">或开始一段新对话</text>
        </view>
        <view class="quick-roles" v-if="localRoles.length">
          <text class="quick-label">选择角色</text>
          <view class="role-grid">
            <view
              v-for="r in localRoles"
              :key="r.id"
              class="role-chip press-scale"
              @click="startChat(r)"
            >
              <Avatar :src="r.avatar" :size="64" :name="r.name" />
              <text class="chip-name">{{ r.name }}</text>
            </view>
          </view>
        </view>
        <view v-else class="go-role-wrap">
          <text class="go-role-hint">去角色页创建或选择一个角色开始对话</text>
          <view class="go-role-btn" @click="goRoleTab">去角色页</view>
        </view>
      </template>

      <!-- 无历史会话 → 选角色 -->
      <template v-else>
        <view class="welcome-header">
          <text class="welcome-title">开始对话</text>
          <text class="welcome-sub">选择一个角色开始聊天</text>
        </view>
        <Loading
          v-if="loadingRoles"
          type="skeleton"
          :skeleton-count="3"
          :skeleton-widths="['60%', '45%', '55%']"
        />
        <view v-else-if="localRoles.length" class="role-grid full">
          <view
            v-for="r in localRoles"
            :key="r.id"
            class="role-card press-scale"
            @click="startChat(r)"
          >
            <Avatar :src="r.avatar" :size="96" :name="r.name" />
            <text class="role-name">{{ r.name }}</text>
            <text class="role-desc">{{ r.desc }}</text>
          </view>
        </view>
        <EmptyState
          v-else
          icon="💬"
          title="还没有角色"
          description="请先创建一个角色再开始对话"
          actionText="去创建"
          @action="goRoleTab"
        />
      </template>
    </scroll-view>

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
          <view class="limit-btn" @click="goRoleTab">
            <text class="limit-btn-icon">🏠</text>
            <text>返回角色页</text>
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
      
    </template>

  </view>
</template>

<script>
import { ref, computed } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { useChatStore, useRoleStore, useUserStore } from '@/store'
import { getRoleList } from '@/api/sync'
import { generateReply } from '@/api/chat'
import ChatMessageList from '@/components/business/ChatMessageList.vue'
import ChatInput from '@/components/business/ChatInput.vue'
import SessionCard from '@/components/business/SessionCard.vue'
import Avatar from '@/components/common/Avatar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import NetworkAlert from '@/components/common/NetworkAlert.vue'
import Loading from '@/components/common/Loading.vue'

export default {
  components: {
    ChatMessageList, ChatInput, SessionCard, Avatar,
    EmptyState, NetworkAlert, Loading
  },
  setup() {
    const chat = useChatStore()
    const roleStore = useRoleStore()
    const { messages, loading, isTyping, isMaxRound, roundCount, currentSession } = storeToRefs(chat)

    const isOnline = ref(true)
    const loadingRoles = ref(false)
    const localRoles = ref([])

    // 从 chat store 获取已保存的会话（最近 5 条）
    const savedSessions = computed(() =>
      chat.sessions.filter(s => s.status === 'active').slice(0, 5)
    )

    async function fetchRoles() {
      if (roleStore.roles.length) {
        localRoles.value = roleStore.roles
        return
      }
      loadingRoles.value = true
      try {
        const user = useUserStore()
        if (!user.isReady) return
        const data = await getRoleList(user.userId)
        localRoles.value = (data.roles || []).map(r => ({
          id: r.role_id,
          name: r.name,
          avatar: r.avatar || '',
          desc: r.last_session_title || `${r.message_count || 0} 条消息分析`,
          messageCount: r.message_count || 0,
        }))
      } catch (e) {
        console.warn('[对话页] 拉取角色列表失败:', e.message)
      } finally {
        loadingRoles.value = false
      }
    }

    // 更新导航标题：角色名 轮数/30
    function updateNavTitle() {
      if (chat.currentSession) {
        const name = chat.currentSession.roleName
        const count = chat.roundCount
        uni.setNavigationBarTitle({ title: `${name} ${count}/30` })
      } else {
        uni.setNavigationBarTitle({ title: '对话' })
      }
    }

    onShow(() => {
      if (!chat.currentSessionId && chat.sessions.length > 0) {
        chat.switchSession(chat.sessions[0].id)
      }
      updateNavTitle()
      // 加载角色列表用于起始页展示
      if (!chat.currentSessionId) {
        fetchRoles()
      }
      // 网络状态
      uni.getNetworkType({
        success: (res) => { isOnline.value = res.networkType !== 'none' }
      })
      uni.onNetworkStatusChange(onNetworkChange)
    })

    function onNetworkChange(res) {
      isOnline.value = res.isConnected
    }

    onHide(() => {
      uni.offNetworkStatusChange(onNetworkChange)
    })

    function resumeSession(session) {
      chat.switchSession(session.id)
      updateNavTitle()
    }

    function startChat(role) {
      chat.createSession(role.id, role.name)
      updateNavTitle()
    }

    function goRoleTab() {
      uni.switchTab({ url: '/pages/index/index' })
    }

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
        updateNavTitle()
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

    return {
      messages, loading, isTyping, isMaxRound, roundCount,
      currentSession, isOnline, chat, savedSessions,
      localRoles, loadingRoles,
      onSend, onLoadMore, newSession, goHistory,
      resumeSession, startChat, goRoleTab
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.chat-page {
  display: flex;
  flex-direction: column;
  background: $ink-bg;
  overflow: hidden;
  // #ifdef H5
  height: calc(100vh - 44px - 50px); /* nav + tab bar */
  // #endif
  // #ifndef H5
  height: 100vh;
  // #endif
}

// ── 起始页（可滚动容器） ──
.no-session-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

// ── 起始页 ──
.welcome-header {
  padding: 40rpx 30rpx 20rpx;
}

.welcome-title {
  font-size: 44rpx;
  font-weight: 700;
  color: $ink-text;
  display: block;
}

.welcome-sub {
  font-size: $font-sm;
  color: $ink-text-secondary;
  margin-top: 8rpx;
  display: block;
}

// ── 会话列表 ──
.session-list {
  padding: 0 30rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

// ── 分割线 ──
.divider {
  display: flex;
  align-items: center;
  padding: 24rpx 30rpx;
  gap: 20rpx;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1rpx;
    background: $ink-border;
  }
}

.divider-text {
  font-size: $font-sm;
  color: $ink-text-tertiary;
  white-space: nowrap;
}

// ── 快捷角色选择 ──
.quick-roles {
  padding: 0 30rpx;
}

.quick-label {
  font-size: $font-sm;
  color: $ink-text-secondary;
  margin-bottom: 16rpx;
  display: block;
}

.role-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;

  &.full {
    padding: 0 30rpx 30rpx;
    gap: 20rpx;
  }
}

.role-chip {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 16rpx 20rpx;
  background: $ink-surface;
  border-radius: $radius-full;
  box-shadow: $shadow-sm;
  transition: all $transition-fast;

  &:active {
    background: $ink-primary-light;
    transform: scale(0.95);
  }
}

.chip-name {
  font-size: $font-sm;
  font-weight: 500;
  color: $ink-text;
}

// ── 角色卡片（全尺寸） ──
.role-card {
  width: calc(50% - 10rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 16rpx;
  background: $ink-surface;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
  transition: all $transition-fast;
  text-align: center;

  &:active {
    background: $ink-primary-light;
    transform: scale(0.97);
  }
}

.role-name {
  font-size: $font-md;
  font-weight: 600;
  color: $ink-text;
}

.role-desc {
  font-size: $font-xs;
  color: $ink-text-secondary;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// ── 引导区域 ──
.go-role-wrap {
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.go-role-hint {
  font-size: $font-sm;
  color: $ink-text-tertiary;
}

.go-role-btn {
  padding: 16rpx 48rpx;
  background: $ink-primary;
  color: #fff;
  font-size: $font-md;
  font-weight: 500;
  border-radius: $radius-full;
  transition: all $transition-fast;

  &:active {
    opacity: 0.8;
    transform: scale(0.95);
  }
}

// ── 上限面板 ──
.round-limit-bar {
  background: $ink-surface;
  padding: 32rpx 40rpx;
  text-align: center;
  border-top: 1rpx solid $ink-border;
  animation: limitSlideUp 0.35s ease-out both;
}

@keyframes limitSlideUp {
  from { transform: translateY(30rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.limit-icon { font-size: 64rpx; margin-bottom: 12rpx; }

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

.limit-actions { display: flex; gap: 20rpx; justify-content: center; }

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

.limit-btn-icon { font-size: 32rpx; }
</style>
