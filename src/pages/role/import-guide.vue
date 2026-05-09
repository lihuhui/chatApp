<template>
  <PageContainer title="导入聊天记录">
    <view class="step-list stagger-enter">
      <view class="step" v-for="(s, i) in steps" :key="i" :style="{ animationDelay: i * 0.12 + 's' }">
        <view class="step-num">
          <text>{{ i + 1 }}</text>
        </view>
        <view class="step-content">
          <text class="step-title">{{ s.title }}</text>
          <text class="step-desc">{{ s.desc }}</text>
        </view>
      </view>
    </view>
    <view class="next-btn-wrap" style="padding: 0 24rpx">
      <view class="next-btn press-scale" @click="goNext">
        <text class="next-label">我已准备好聊天记录</text>
        <text class="next-arrow">→</text>
      </view>
    </view>
  </PageContainer>
</template>

<script>
import { ref } from 'vue'
import { useImportStore } from '@/store'
import PageContainer from '@/components/common/PageContainer.vue'

export default {
  components: { PageContainer },
  setup() {
    const importStore = useImportStore()
    const steps = ref([
      { title: '打开微信', desc: '进入你想分析的好友/群聊对话' },
      { title: '复制聊天记录', desc: '长按消息区域，选择"多选"后复制' },
      { title: '粘贴到 App', desc: '返回本 App，在下一步粘贴完整内容' }
    ])

    function goNext() {
      importStore.goToStep('paste')
      uni.navigateTo({ url: '/pages/role/import-parse' })
    }

    return { steps, goNext }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.step-list { padding: 24rpx; }

.step {
  display: flex;
  background: $ink-surface;
  border-radius: $radius-md;
  padding: 30rpx;
  margin-bottom: 20rpx;
  align-items: flex-start;
  box-shadow: $shadow-sm;
  border-left: $binding-width solid $ink-primary-light;
  transition: border-color $transition-fast;

  &:active {
    border-left-color: $ink-primary;
  }
}

.step-num {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  color: #fff;
  text-align: center;
  line-height: 48rpx;
  font-size: $font-md;
  margin-right: 20rpx;
  flex-shrink: 0;
  font-weight: 600;
}

.step-content { flex: 1; }

.step-title {
  font-size: $font-md;
  font-weight: 600;
  color: $ink-text;
  display: block;
  margin-bottom: 8rpx;
}

.step-desc {
  font-size: $font-sm;
  color: $ink-text-secondary;
  line-height: 1.6;
}

.next-btn-wrap {
  margin-top: 16rpx;
}

.next-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 88rpx;
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  color: #fff;
  border-radius: $radius-md;
  font-size: $font-md;
  font-weight: 600;
  letter-spacing: 2rpx;
  box-shadow: 0 4rpx 16rpx rgba(42, 157, 143, 0.25);
}

.next-label {
  line-height: 1;
}

.next-arrow {
  font-size: 28rpx;
  line-height: 1;
  transition: transform $transition-fast;
}

.next-btn:active .next-arrow {
  transform: translateX(6rpx);
}
</style>
