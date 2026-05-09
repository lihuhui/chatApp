<template>
  <!-- #ifdef APP-PLUS -->
  <view class="ai-speaker-selector">
    <text class="selector-title">选择对话中的说话人</text>
    <text class="selector-subtitle">聊天记录中识别到以下说话人，请确认并选择</text>

    <view class="speaker-list">
      <view
        v-for="(speaker, idx) in speakers"
        :key="idx"
        class="speaker-item"
        :class="{ 'item-selected': isSelected(speaker.name) }"
        @click="toggleSpeaker(speaker.name)"
      >
        <view class="speaker-check">
          <view v-if="isSelected(speaker.name)" class="check-mark" />
        </view>
        <view class="speaker-avatar" :style="{ background: avatarColor(idx) }">
          <text class="speaker-initial">{{ speaker.name.charAt(0) }}</text>
        </view>
        <view class="speaker-info">
          <text class="speaker-name">{{ speaker.name }}</text>
          <text class="speaker-count">{{ speaker.messageCount }} 条消息</text>
        </view>
      </view>
    </view>

    <view class="selector-actions">
      <button class="btn-clear" @click="$emit('update', [])">清空</button>
      <button class="btn-confirm" @click="$emit('confirm', selected)">确认 ({{ selected.length }})</button>
    </view>
  </view>
  <!-- #endif -->
</template>

<script>
export default {
  props: {
    speakers: { type: Array, default: () => [] },
    // speakers: [{ name, messageCount }]
    selected: { type: Array, default: () => [] }
    // selected: [name1, name2, ...]
  },
  emits: ['update', 'confirm'],
  methods: {
    isSelected(name) {
      return this.selected.includes(name)
    },
    toggleSpeaker(name) {
      const list = [...this.selected]
      const idx = list.indexOf(name)
      if (idx >= 0) {
        list.splice(idx, 1)
      } else {
        list.push(name)
      }
      this.$emit('update', list)
    },
    avatarColor(idx) {
      const colors = ['#2A9D8F', '#E9C46A', '#E76F51', '#2970FF', '#C94A7C', '#4A6CC9']
      return colors[idx % colors.length]
    }
  }
}
</script>

<style lang="scss" scoped>
@use '../common/variables' as *;

.ai-speaker-selector {
  padding: 32rpx 24rpx;
}

.selector-title {
  display: block;
  font-size: $font-lg;
  font-weight: 600;
  color: $ink-text;
  margin-bottom: 8rpx;
}

.selector-subtitle {
  display: block;
  font-size: $font-sm;
  color: $ink-text-secondary;
  margin-bottom: 32rpx;
  line-height: 1.5;
}

.speaker-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 40rpx;
}

.speaker-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: $ink-surface;
  border-radius: $radius-md;
  gap: 16rpx;
  border: 2rpx solid transparent;
  transition: all $transition-fast;

  &.item-selected {
    border-color: $ink-primary;
    background: $ink-primary-light;
  }
}

.speaker-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid $ink-border;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all $transition-fast;

  .item-selected & {
    background: $ink-primary;
    border-color: $ink-primary;
  }
}

.check-mark {
  width: 12rpx;
  height: 20rpx;
  border: solid #fff;
  border-width: 0 3rpx 3rpx 0;
  transform: rotate(45deg);
  margin-top: -4rpx;
}

.speaker-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.speaker-initial {
  font-size: $font-md;
  font-weight: 600;
  color: #fff;
}

.speaker-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.speaker-name {
  font-size: $font-base;
  font-weight: 500;
  color: $ink-text;
}

.speaker-count {
  font-size: $font-xs;
  color: $ink-text-tertiary;
}

.selector-actions {
  display: flex;
  gap: 20rpx;
}

.btn-clear {
  flex: 1;
  height: 76rpx;
  line-height: 76rpx;
  background: $ink-bg;
  color: $ink-text-secondary;
  border-radius: $radius-md;
  font-size: $font-md;
  border: none;
}

.btn-confirm {
  flex: 2;
  height: 76rpx;
  line-height: 76rpx;
  background: $ink-primary;
  color: #fff;
  border-radius: $radius-md;
  font-size: $font-md;
  border: none;
}
</style>
