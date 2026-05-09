<template>
  <PageContainer title="对话回顾">
    <Loading v-if="loading" type="skeleton-chat" :skeleton-count="3" />
    <ErrorState
      v-else-if="loadFailed"
      message="加载消息记录失败"
      @retry="fetchHistory"
    />
    <EmptyState v-else-if="messages.length === 0" icon="🕐" title="没有消息记录" description="开始一段对话后，这里会显示历史记录" />
    <scroll-view v-else class="msg-list" scroll-y>
      <view
        v-for="(m, idx) in messages"
        :key="m.id"
        class="msg-row"
        :class="m.sender === 'user' ? 'right' : 'left'"
        :style="{ animationDelay: idx * 0.03 + 's' }"
      >
        <ChatBubble
          :content="m.content"
          :type="m.sender === 'user' ? 'sent' : 'received'"
          :time="formatTime(m.createdAt)"
        />
      </view>
    </scroll-view>
  </PageContainer>
</template>

<script>
import { ref } from 'vue'
import { useChatStore } from '@/store'
import PageContainer from '@/components/common/PageContainer.vue'
import Loading from '@/components/common/Loading.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ChatBubble from '@/components/business/ChatBubble.vue'

export default {
  components: { PageContainer, Loading, ErrorState, EmptyState, ChatBubble },
  setup() {
    const chatStore = useChatStore()
    const loading = ref(false)
    const loadFailed = ref(false)
    const messages = ref(chatStore.messages || [])

    function fetchHistory() {
      loadFailed.value = false
      messages.value = chatStore.messages || []
    }

    function formatTime(ts) {
      if (!ts) return ''
      const d = new Date(ts)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }

    return { loading, loadFailed, messages, fetchHistory, formatTime }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.msg-list {
  padding: 24rpx 20rpx;
  height: 100%;
}

.msg-row {
  margin-bottom: 24rpx;
  display: flex;
  animation: msgIn 0.35s $ease-out both;

  &.right {
    justify-content: flex-end;
  }
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(12rpx); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
