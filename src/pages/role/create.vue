<template>
  <view class="page stagger-enter">
    <!-- #ifdef APP-PLUS -->
    <view class="form">
      <view class="phase-header" style="animation-delay: 0s">
        <text class="phase-title">创建角色</text>
        <text class="phase-desc">设置角色昵称和头像</text>
      </view>

      <view class="avatar-section" style="animation-delay: 0.08s">
        <view class="avatar-placeholder" :class="{ 'has-img': avatar }" @click="pickAvatar">
          <text v-if="!avatar" class="avatar-text">+</text>
          <image v-else :src="avatar" class="avatar-img" />
        </view>
        <text class="avatar-hint">{{ avatar ? '点击更换' : '点击设置头像' }}</text>
      </view>

      <view class="input-wrap" style="animation-delay: 0.16s">
        <input
          class="name-input"
          v-model="name"
          placeholder="输入角色昵称"
          maxlength="20"
        />
      </view>

      <view class="submit-wrap" style="animation-delay: 0.24s">
        <view
          class="submit-btn press-scale"
          :class="{ 'btn-disabled': !name.trim() }"
          @click="onSubmit"
        >
          <text class="submit-label">创建角色</text>
        </view>
      </view>
    </view>
    <!-- #endif -->
    <!-- #ifdef MP-WEIXIN -->
    <view class="mp-block">
      <text class="mp-block-icon">📱</text>
      <text class="mp-block-title">小程序暂不支持创建角色</text>
      <text class="mp-block-desc">请下载 App 创建自定义角色</text>
      <view class="mp-block-btn press-scale" @click="goDownload">
        <text>下载 App</text>
      </view>
    </view>
    <!-- #endif -->
  </view>
</template>

<script>
import { ref } from 'vue'
import { useRoleStore } from '@/store'

export default {
  setup() {
    const name = ref('')
    const avatar = ref('')
    const roleStore = useRoleStore()

    function pickAvatar() {
      // #ifdef APP-PLUS || H5
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          avatar.value = res.tempFilePaths[0]
        },
        fail: () => {
          // 用户取消选择，不做处理
        }
      })
      // #endif
    }

    function onSubmit() {
      if (!name.value.trim()) return
      roleStore.setCurrentRole({
        id: Date.now().toString(),
        name: name.value.trim(),
        avatar: avatar.value,
        desc: '',
        messageCount: 0
      })
      uni.navigateTo({ url: '/pages/role/import-guide' })
    }

    function goDownload() {
      uni.navigateTo({ url: '/pages/download/index' })
    }

    return { name, avatar, pickAvatar, onSubmit, goDownload }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.page { min-height: 100vh; background: $ink-bg; padding: 40rpx; }

.phase-header {
  text-align: center;
  margin-bottom: 48rpx;

  .phase-title {
    font-size: $font-xxl;
    font-weight: 700;
    color: $ink-text;
    display: block;
    letter-spacing: 2rpx;
  }

  .phase-desc {
    font-size: $font-base;
    color: $ink-text-secondary;
    margin-top: 8rpx;
    display: block;
  }
}

.form {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-section {
  margin-bottom: 48rpx;
  text-align: center;
}

.avatar-placeholder {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: $ink-border;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid transparent;
  transition: border-color $transition-fast;

  &:active {
    border-color: $ink-primary;
  }

  &.has-img {
    border-color: $ink-primary-light;
  }
}

.avatar-text {
  font-size: 64rpx;
  color: $ink-text-tertiary;
  font-weight: 300;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-hint {
  font-size: $font-sm;
  color: $ink-text-tertiary;
  margin-top: 14rpx;
  display: block;
}

.input-wrap {
  width: 100%;
  margin-bottom: 40rpx;
}

.name-input {
  width: 100%;
  height: 88rpx;
  background: $ink-surface;
  border-radius: $radius-md;
  padding: 0 28rpx;
  font-size: $font-md;
  border: 2rpx solid transparent;
  transition: border-color $transition-fast, box-shadow $transition-fast;
  box-sizing: border-box;

  &:focus {
    border-color: $ink-primary;
    box-shadow: 0 0 0 4rpx rgba(42, 157, 143, 0.12);
  }
}

.submit-wrap {
  width: 100%;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  border-radius: $radius-md;
  box-shadow: 0 4rpx 16rpx rgba(42, 157, 143, 0.25);

  &.btn-disabled {
    opacity: 0.4;
  }
}

.submit-label {
  font-size: $font-md;
  font-weight: 600;
  color: #fff;
  letter-spacing: 2rpx;
  line-height: 1;
}

.mp-tip {
  text-align: center;
  font-size: $font-sm;
  color: $ink-text-tertiary;
  margin-top: 48rpx;
}

// ── 小程序阻止访问 ──
.mp-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 160rpx;
  text-align: center;
}

.mp-block-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 24rpx;
}

.mp-block-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $ink-text;
  display: block;
  margin-bottom: 8rpx;
}

.mp-block-desc {
  font-size: $font-sm;
  color: $ink-text-secondary;
  display: block;
  margin-bottom: 32rpx;
}

.mp-block-btn {
  padding: 20rpx 48rpx;
  background: linear-gradient(135deg, $ink-primary, $ink-primary-dark);
  color: #fff;
  border-radius: $radius-full;
  font-size: $font-md;
  font-weight: 500;
  box-shadow: 0 4rpx 16rpx rgba(42, 157, 143, 0.25);
}
</style>
