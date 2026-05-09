<template>
	<PageContainer title="对话列表">
		<EmptyState
			v-if="sessionList.length === 0"
			icon="💬"
			title="暂无对话"
			description="从角色页开始一段新对话吧"
		/>
		<view v-else class="list stagger-enter">
			<SessionCard
				v-for="(s, idx) in sessionList"
				:key="s.id"
				:title="s.roleName"
				:round-count="s.roundCount"
				:last-time="s.lastTime"
				:status="s.status"
				:style="{ animationDelay: idx * 0.06 + 's' }"
				@click="goChat(s)"
			/>
		</view>
	</PageContainer>
</template>

<script>
import { computed } from 'vue'
import { useChatStore } from '@/store'
import PageContainer from '@/components/common/PageContainer.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import SessionCard from '@/components/business/SessionCard.vue'

export default {
	components: { PageContainer, EmptyState, SessionCard },
	setup() {
		const chat = useChatStore()

		const sessionList = computed(() => chat.getSessions())

		function goChat(session) {
			chat.switchSession(session.id)
			uni.switchTab({ url: '/pages/chat/chat' })
		}

		return { sessionList, goChat }
	}
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;
.list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	padding: 24rpx 20rpx;
}
</style>
