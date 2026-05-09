<template>
  <view class="container stagger-enter">
    <!-- 标题 + 用户信息 -->
    <view class="header" style="animation-delay: 0s">
      <view class="header-left">
        <text class="title">暖墨</text>
        <text v-if="user.isReady" class="user-id">{{ user.userId.slice(0, 8) }}...</text>
      </view>
      <view class="header-right">
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
    <view class="section press-scale" style="animation-delay: 0.08s" @click="goImport">
      <view class="section-row">
        <view class="section-icon import-icon">
          <text class="icon-text">📥</text>
        </view>
        <view class="section-body">
          <text class="section-title">导入聊天记录</text>
          <text class="section-desc">粘贴微信聊天记录，分析风格特征</text>
        </view>
        <view class="section-arrow-wrap">
          <text class="section-arrow">›</text>
        </view>
      </view>
    </view>
    <!-- #endif -->

    <!-- 我的角色 -->
    <view class="section" style="animation-delay: 0.16s">
      <view class="section-header">
        <text class="section-title">我的角色</text>
        <text v-if="roles.length" class="section-more" @click="goRoleList">查看全部 ›</text>
      </view>
      <view v-if="roleStore.loading" class="section-loading">
        <Loading type="skeleton" :skeleton-count="2" :skeleton-widths="['70%', '50%']" />
      </view>
      <!-- #ifdef APP-PLUS -->
      <EmptyState
        v-else-if="roles.length === 0"
        icon="🤖"
        title="还没有角色"
        description="导入聊天记录创建你的第一个角色"
        actionText="创建角色"
        @action="goCreate"
      />
      <!-- #endif -->
      <!-- #ifdef MP-WEIXIN -->
      <EmptyState
        v-else-if="roles.length === 0"
        icon="🤖"
        title="还没有角色"
        description="请从角色列表选择一个角色开始对话"
        actionText="查看角色列表"
        @action="goRoleList"
      />
      <!-- #endif -->
      <view v-else class="role-list">
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
    </view>

    <!-- 示例角色 -->
    <view class="section press-scale" style="animation-delay: 0.24s" @click="onSampleClick">
      <view class="section-row">
        <view class="section-icon sample-icon">
          <text class="icon-text">👋</text>
        </view>
        <view class="section-body">
          <text class="section-title">示例角色 · 小明</text>
          <text class="section-desc">体验与 AI 模拟角色的对话</text>
        </view>
        <view class="section-arrow-wrap">
          <text class="section-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- #ifdef MP-WEIXIN -->
    <view class="download-banner press-scale" style="animation-delay: 0.32s" @click="goDownload">
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

    // 每次首页显示时从云端拉取角色列表
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
        console.warn('[首页] 拉取角色列表失败:', e.message)
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
      chatStore.createSession(role.id, role.name)
      uni.switchTab({ url: '/pages/chat/chat' })
    }

    function onSampleClick() {
      chatStore.createSession('sample', '小明')
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
@use 'sass:color';
@use '../../components/common/variables' as *;

.container {
  padding: 30rpx;
  min-height: 100vh;
  background: $ink-bg;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.title {
  font-size: 44rpx;
  font-weight: 700;
  color: $ink-text;
  letter-spacing: 4rpx;
  // 墨玉青点缀
  &::after {
    content: '';
    display: inline-block;
    width: 12rpx;
    height: 12rpx;
    background: $ink-primary;
    border-radius: 50%;
    margin-left: 6rpx;
    vertical-align: super;
    animation: titlePulse 2s ease-in-out infinite;
  }
}

@keyframes titlePulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.user-id {
  font-size: $font-xs;
  color: $ink-text-tertiary;
  font-family: monospace;
}

.header-right {
  display: flex;
  align-items: center;
}

.platform-badge {
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: $radius-full;
  font-weight: 500;

  &.app { background: $ink-primary-light; color: $ink-primary-dark; }
  &.mp { background: #E3F0FF; color: #2970FF; }
}

// ── 通用区块 ──
.section {
  background: $ink-surface;
  border-radius: $radius-md;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-sm;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-more {
  font-size: $font-sm;
  color: $ink-text-tertiary;
}

.section-loading {
  padding: 10rpx 0;
}

// ── 行式入口 ──
.section-row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  transition: all $transition-fast;
  border-left: $binding-width solid transparent;
  border-radius: 0 $radius-md $radius-md 0;
  margin-left: -$binding-width;
  padding-left: calc(26rpx - 2rpx);

  &:active {
    background: $ink-primary-light;
    border-left-color: $ink-primary;
  }
}

.section-arrow-wrap {
  flex-shrink: 0;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $ink-bg;
  transition: background $transition-fast;
}

.section-row:active .section-arrow-wrap {
  background: $ink-primary-light;
}

.section-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  flex-shrink: 0;
}

.import-icon { background: $ink-primary-light; }
.sample-icon { background: $ink-warning-light; }

.section-body {
  flex: 1;

  .section-title {
    font-size: $font-md;
    font-weight: 600;
    color: $ink-text;
    display: block;
  }

  .section-desc {
    font-size: $font-sm;
    color: $ink-text-secondary;
    margin-top: 4rpx;
    display: block;
  }
}

.section-arrow {
  font-size: 40rpx;
  color: $ink-text-tertiary;
  line-height: 1;
}

// ── 角色列表 ──
.role-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
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
    background: color.adjust($ink-warning-light, $lightness: -5%);
    transform: scale(0.98);
  }
}
</style>
