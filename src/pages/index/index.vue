<template>
  <view class="container stagger-enter">
    <!-- 精简顶栏 -->
    <view class="top-bar" style="animation-delay: 0s">
      <text class="page-title">角色</text>
      <view class="top-bar-right">
        <!-- #ifdef APP-PLUS -->
        <view class="platform-badge app">App</view>
        <!-- #endif -->
        <!-- #ifdef MP-WEIXIN -->
        <view class="platform-badge mp">小程序</view>
        <!-- #endif -->
      </view>
    </view>

    <!-- 导入入口（仅 App 端） -->
    <!-- #ifdef APP-PLUS -->
    <view class="action-card press-scale" style="animation-delay: 0.06s" @click="goImport">
      <text class="action-icon">📥</text>
      <view class="action-body">
        <text class="action-title">导入聊天记录</text>
        <text class="action-desc">从微信聊天记录创建新角色</text>
      </view>
      <text class="action-arrow">›</text>
    </view>
    <!-- #endif -->

    <!-- 角色列表 -->
    <view class="section" style="animation-delay: 0.12s">
      <view class="section-header">
        <text class="section-title">我的角色</text>
        <view class="section-actions">
          <!-- #ifdef APP-PLUS -->
          <text v-if="roles.length" class="action-link" @click="goCreate">+ 新建</text>
          <!-- #endif -->
        </view>
      </view>

      <Loading
        v-if="roleStore.loading"
        type="skeleton"
        :skeleton-count="2"
        :skeleton-widths="['70%', '50%']"
      />
      <view v-else-if="roles.length" class="role-list">
        <RoleCard
          v-for="r in roles"
          :key="r.id"
          :name="r.name"
          :avatar="r.avatar"
          :desc="r.desc"
          :message-count="r.messageCount"
          @click="goChat(r)"
        />
      </view>
      <!-- #ifdef APP-PLUS -->
      <EmptyState
        v-else
        icon="🤖"
        title="还没有角色"
        description="导入聊天记录创建你的第一个角色"
        actionText="导入记录"
        @action="goImport"
      />
      <!-- #endif -->
      <!-- #ifdef MP-WEIXIN -->
      <EmptyState
        v-else
        icon="🤖"
        title="还没有角色"
        description="请从下方示例角色开始体验"
      />
      <!-- #endif -->
    </view>

    <!-- 示例角色 -->
    <view class="action-card press-scale" style="animation-delay: 0.18s" @click="onSampleClick">
      <text class="action-icon">👋</text>
      <view class="action-body">
        <text class="action-title">示例角色 · 小明</text>
        <text class="action-desc">体验与 AI 模拟角色的对话</text>
      </view>
      <text class="action-arrow">›</text>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <view class="download-banner press-scale" style="animation-delay: 0.24s" @click="goDownload">
      <text class="dl-text">💡 下载 App 创建自定义角色，体验完整功能</text>
    </view>
    <!-- #endif -->
  </view>
</template>

<script>
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { useUserStore, useRoleStore, useChatStore } from '@/store'
import { getRoleList } from '@/api/sync'
import RoleCard from '@/components/business/RoleCard.vue'
import Loading from '@/components/common/Loading.vue'
import EmptyState from '@/components/common/EmptyState.vue'

export default {
  components: { RoleCard, Loading, EmptyState },
  setup() {
    const user = useUserStore()
    const roleStore = useRoleStore()
    const chatStore = useChatStore()
    const { roles } = storeToRefs(roleStore)

    onShow(async () => {
      if (!user.isReady) return
      roleStore.setLoading(true)
      try {
        const data = await getRoleList(user.userId)
        const list = (data.roles || []).map(r => ({
          id: r.role_id,
          name: r.name,
          avatar: r.avatar || '',
          desc: r.last_session_title || `${r.message_count || 0} 条消息分析`,
          messageCount: r.message_count || 0,
        }))
        if (list.length > 0) {
          roleStore.setRoles(list)
        }
      } catch (e) {
        console.warn('[角色页] 拉取角色列表失败:', e.message)
      } finally {
        roleStore.setLoading(false)
      }
    })

    function goCreate() {
      uni.navigateTo({ url: '/pages/role/create' })
    }

    function goImport() {
      uni.navigateTo({ url: '/pages/role/import-guide' })
    }

    function goRoleList() {
      uni.navigateTo({ url: '/pages/role/list' })
    }

    function goChat(role) {
      const existing = chatStore.sessions.find(
        s => s.roleId === role.id && s.status === 'active'
      )
      if (existing) {
        chatStore.switchSession(existing.id)
      } else {
        chatStore.createSession(role.id, role.name)
      }
      uni.switchTab({ url: '/pages/chat/chat' })
    }

    function onSampleClick() {
      const existing = chatStore.sessions.find(
        s => s.roleId === 'sample' && s.status === 'active'
      )
      if (existing) {
        chatStore.switchSession(existing.id)
      } else {
        chatStore.createSession('sample', '小明')
      }
      uni.switchTab({ url: '/pages/chat/chat' })
    }

    function goDownload() {
      uni.navigateTo({ url: '/pages/download/index' })
    }

    return {
      user,
      roleStore,
      roles,
      goCreate, goImport, goRoleList, goChat, onSampleClick, goDownload
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.container {
  display: flex;
  flex-direction: column;
  padding: 30rpx;
  // #ifdef H5
  min-height: calc(100vh - 44px - 50px);
  // #endif
  // #ifndef H5
  min-height: 100vh;
  // #endif
  background: $ink-bg;
}

.section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: $ink-surface;
  border-radius: $radius-md;
  padding: 28rpx;
  margin-bottom: 16rpx;
  box-shadow: $shadow-sm;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

// ── 精简顶栏 ──
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.page-title {
  font-size: 44rpx;
  font-weight: 700;
  color: $ink-text;
  letter-spacing: 2rpx;
}

.platform-badge {
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: $radius-full;
  font-weight: 500;

  &.app { background: $ink-primary-light; color: $ink-primary-dark; }
  &.mp { background: #E3F0FF; color: #2970FF; }
}

// ── 行动卡片（导入 / 示例） ──
.action-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: $ink-surface;
  border-radius: $radius-md;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: $shadow-sm;
  transition: all $transition-fast;
  border-left: 6rpx solid transparent;

  &:active {
    background: $ink-primary-light;
    border-left-color: $ink-primary;
    transform: scale(0.985);
  }
}

.action-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  flex-shrink: 0;
}

.action-body {
  flex: 1;
}

.action-title {
  font-size: $font-md;
  font-weight: 600;
  color: $ink-text;
  display: block;
}

.action-desc {
  font-size: $font-sm;
  color: $ink-text-secondary;
  margin-top: 4rpx;
  display: block;
}

.action-arrow {
  font-size: 36rpx;
  color: $ink-text-tertiary;
  flex-shrink: 0;
}

// ── 角色区块头部 ──
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: $font-md;
  font-weight: 600;
  color: $ink-text;
}

.section-actions {
  display: flex;
  gap: 20rpx;
}

.action-link {
  font-size: $font-sm;
  color: $ink-primary;

  &:active {
    opacity: 0.7;
  }
}

// ── 下载提示 ──
.download-banner {
  padding: 24rpx;
  text-align: center;
  background: $ink-warning-light;
  border-radius: $radius-md;
  font-size: $font-sm;
  color: #B89440;
  border: 1rpx solid rgba($ink-warning, 0.2);
  transition: all $transition-fast;

  &:active {
    transform: scale(0.98);
  }
}
</style>
