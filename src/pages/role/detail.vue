<template>
  <PageContainer title="角色详情">
    <view class="page-content stagger-enter">
      <view class="info-card" style="animation-delay: 0s">
        <view class="info-avatar">
          <Avatar :size="120" :name="currentRole?.name || '?'" />
        </view>
        <text class="name">{{ currentRole?.name || '未知角色' }}</text>
        <text class="msg-count">基于 {{ currentRole?.messageCount || 0 }} 条消息分析</text>
      </view>

      <view class="actions" style="animation-delay: 0.12s">
        <view class="action-item press-scale" @click="goChat">
          <view class="action-left">
            <text class="action-icon">💬</text>
            <text>开始对话</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="action-item press-scale" @click="reImport">
          <view class="action-left">
            <text class="action-icon">📥</text>
            <text>重新导入聊天记录</text>
          </view>
          <text class="arrow">›</text>
        </view>
        <view class="action-item delete press-scale" @click="onDelete">
          <view class="action-left">
            <text class="action-icon">🗑️</text>
            <text>删除角色</text>
          </view>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
  </PageContainer>
</template>

<script>
import { computed } from 'vue'
import { useRoleStore, useChatStore } from '@/store'
import PageContainer from '@/components/common/PageContainer.vue'
import Avatar from '@/components/common/Avatar.vue'
import db from '@/utils/database'
import * as syncApi from '@/api/sync'

export default {
  components: { PageContainer, Avatar },
  setup() {
    const roleStore = useRoleStore()
    const chatStore = useChatStore()

    const currentRole = computed(() => roleStore.currentRole)

    function goChat() {
      if (!currentRole.value) return
      chatStore.createSession(currentRole.value.id, currentRole.value.name)
      uni.switchTab({ url: '/pages/chat/chat' })
    }

    function reImport() {
      uni.navigateTo({ url: '/pages/role/import-guide' })
    }

    async function onDelete() {
      uni.showModal({
        title: '确认删除',
        content: '删除后角色和对话记录将被清除，此操作不可恢复',
        success: async (res) => {
          if (!res.confirm) return

          const roleId = currentRole.value?.id
          if (!roleId) {
            uni.showToast({ title: '删除失败：角色不存在', icon: 'none' })
            return
          }

          let localOk = true
          let cloudOk = true

          // 1. 删除本地 SQLite 数据（App端）
          if (db.isAppPlatform()) {
            try {
              await db.role.remove(roleId)
            } catch (e) {
              console.warn('[删除] 本地删除失败:', e)
              localOk = false
            }
          }

          // 2. 删除云端数据（需用 cloud_sync_id 而非本地数字 ID）
          try {
            const cloudSyncId = db.isAppPlatform()
              ? (await db.role.getById(roleId))?.cloud_sync_id
              : currentRole.value?.cloudSyncId

            if (cloudSyncId) {
              await syncApi.deleteRole(cloudSyncId)
            }
            // 没有 cloudSyncId → 从未同步过，跳过云端删除
          } catch (e) {
            console.warn('[删除] 云端删除失败:', e)
            cloudOk = false
          }

          // 3. 清空内存状态
          roleStore.setCurrentRole(null)

          // 4. 反馈结果
          if (localOk && cloudOk) {
            uni.showToast({ title: '已删除', icon: 'success' })
          } else if (!localOk && cloudOk) {
            uni.showToast({ title: '本地删除失败，请重试', icon: 'none' })
            return // 不返回，让用户处理
          } else if (localOk && !cloudOk) {
            uni.showToast({ title: '已从本地删除，云端同步失败', icon: 'none' })
          } else {
            uni.showToast({ title: '删除失败，请重试', icon: 'none' })
            return
          }

          uni.navigateBack()
        }
      })
    }

    return { currentRole, goChat, reImport, onDelete }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.page-content {
  padding: 20rpx;
}

.info-card {
  background: linear-gradient(135deg, $ink-surface, #FAF9F6);
  border-radius: $radius-lg;
  padding: 48rpx 40rpx 40rpx;
  text-align: center;
  margin-bottom: 24rpx;
  box-shadow: $shadow-sm;
  border: 1rpx solid rgba($ink-border, 0.5);
}

.info-avatar {
  margin-bottom: 4rpx;
}

.name {
  font-size: $font-xl;
  font-weight: 700;
  display: block;
  margin-top: 20rpx;
  color: $ink-text;
  letter-spacing: 1rpx;
}

.msg-count {
  font-size: $font-sm;
  color: $ink-text-secondary;
  margin-top: 8rpx;
  display: block;
}

.actions {
  background: $ink-surface;
  border-radius: $radius-md;
  overflow: hidden;
  box-shadow: $shadow-sm;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid $ink-border;
  font-size: $font-md;
  color: $ink-text;

  &:last-child { border-bottom: none; }

  &.delete {
    color: $ink-error;

    .action-icon { opacity: 0.8; }
  }
}

.action-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-icon {
  font-size: 32rpx;
  width: 40rpx;
  text-align: center;
}

.arrow {
  color: $ink-text-tertiary;
  font-size: 36rpx;
  line-height: 1;
}
</style>
