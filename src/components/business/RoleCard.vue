<template>
  <view class="ai-role-card" hover-class="card-hover" @click="$emit('click')">
    <view class="card-left">
      <Avatar :src="avatar" :size="100" :name="name" />
    </view>
    <view class="card-body">
      <text class="card-name">{{ name }}</text>
      <text v-if="desc" class="card-desc">{{ desc }}</text>
      <view v-if="messageCount !== undefined" class="card-meta">
        <text class="meta-label">分析自</text>
        <text class="meta-value">{{ messageCount }} 条消息</text>
      </view>
    </view>
    <view class="card-arrow">
      <text class="arrow-icon">›</text>
    </view>
  </view>
</template>

<script>
import Avatar from '@/components/common/Avatar.vue'

export default {
  components: { Avatar },
  props: {
    avatar: { type: String, default: '' },
    name: { type: String, default: '' },
    desc: { type: String, default: '' },
    messageCount: { type: Number, default: undefined }
  },
  emits: ['click']
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-role-card {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: $ink-surface;
  border-radius: $radius-md;
  gap: 24rpx;
  border-left: 6rpx solid $ink-primary;
  transition: all $transition-fast;
  box-shadow: $shadow-sm;

  &.card-hover {
    background: $ink-primary-light;
    border-left-color: $ink-primary-dark;
    transform: scale(0.98);
  }
}

.card-left {
  flex-shrink: 0;
}

.card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.card-name {
  font-size: $font-md;
  font-weight: 600;
  color: $ink-text;
  letter-spacing: 0.3px;
}

.card-desc {
  font-size: $font-sm;
  color: $ink-text-secondary;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.meta-label {
  font-size: $font-xs;
  color: $ink-text-tertiary;
}

.meta-value {
  font-size: $font-xs;
  color: $ink-primary;
  font-weight: 500;
}

.card-arrow {
  flex-shrink: 0;
  width: 40rpx;
  display: flex;
  justify-content: center;
}

.arrow-icon {
  font-size: 40rpx;
  color: $ink-text-tertiary;
  line-height: 1;
}
</style>
