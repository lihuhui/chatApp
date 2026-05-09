<template>
  <view class="page">
    <PageContainer title="角色列表" :showBack="false">
      <Loading v-if="loading" type="skeleton" :skeleton-count="3" :skeleton-widths="['72%', '55%', '65%']" />
      <ErrorState
        v-else-if="errorMsg && roleList.length === 0"
        :message="errorMsg"
        @retry="fetchRoles"
      />
      <EmptyState
        v-else-if="roleList.length === 0"
        icon="🤖"
        title="还没有角色"
        :description="emptyDesc"
        :actionText="emptyAction"
        @action="onEmptyAction"
      />
      <view v-else class="list stagger-enter">
        <RoleCard
          v-for="(r, idx) in roleList"
          :key="r.id"
          :name="r.name"
          :avatar="r.avatar"
          :desc="r.desc"
          :message-count="r.messageCount"
          :style="{ animationDelay: idx * 0.08 + 's' }"
          @click="goChat(r)"
        />
      </view>
    </PageContainer>
  </view>
</template>

<script>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore, useRoleStore, useChatStore } from '@/store'
import { getRoleList } from '@/api/sync'
import PageContainer from '@/components/common/PageContainer.vue'
import Loading from '@/components/common/Loading.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import RoleCard from '@/components/business/RoleCard.vue'

export default {
  components: { PageContainer, Loading, ErrorState, EmptyState, RoleCard },
  setup() {
    const user = useUserStore()
    const roleStore = useRoleStore()
    const chatStore = useChatStore()
    const loading = ref(false)
    const errorMsg = ref('')
    const roleList = ref([])

    const isApp = computed(() =>
      // #ifdef APP-PLUS
      true
      // #endif
      // #ifndef APP-PLUS
      false
      // #endif
    )

    const emptyDesc = computed(() =>
      isApp.value ? '导入聊天记录或使用示例角色开始吧' : '下载 App 创建你的第一个角色吧'
    )
    const emptyAction = computed(() =>
      isApp.value ? '创建角色' : '下载 App'
    )

    // 从云端拉取角色列表
    async function fetchRoles() {
      if (!user.isReady) return
      loading.value = true
      errorMsg.value = ''
      try {
        const data = await getRoleList(user.userId)
        roleList.value = (data.roles || []).map(r => ({
          id: r.role_id,
          name: r.name,
          avatar: r.avatar || '',
          desc: r.last_session_title || `${r.message_count || 0} 条消息分析`,
          messageCount: r.message_count || 0,
        }))
      } catch (e) {
        console.error('[角色列表] 拉取失败:', e)
        errorMsg.value = '加载失败，下拉重试'
        // 保留空列表，显示空状态
        roleList.value = []
      } finally {
        loading.value = false
      }
    }

    // 每次显示页面时刷新
    onShow(() => {
      // 确保用户已初始化
      if (!user.isReady) {
        user.init()
      }
      fetchRoles()
    })

    function goChat(role) {
      chatStore.createSession(role.id, role.name)
      uni.switchTab({ url: '/pages/chat/chat' })
    }

    function goDownload() {
      uni.navigateTo({ url: '/pages/download/index' })
    }

    function goCreate() {
      uni.navigateTo({ url: '/pages/role/create' })
    }

    function onEmptyAction() {
      if (isApp.value) {
        goCreate()
      } else {
        goDownload()
      }
    }

    return { loading, errorMsg, roleList, fetchRoles, goChat, goDownload, goCreate, onEmptyAction, emptyDesc, emptyAction }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;
.list { display: flex; flex-direction: column; gap: 16rpx; padding: 20rpx; }
</style>
