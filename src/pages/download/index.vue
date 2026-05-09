<template>
  <view class="page">
    <view class="card stagger-enter">
      <view class="card-icon-wrap" style="animation-delay: 0s">
        <text class="big-icon">📲</text>
      </view>
      <text class="title" style="animation-delay: 0.08s">下载 App</text>
      <text class="subtitle" style="animation-delay: 0.12s">体验完整功能</text>

      <view class="feature-list" style="animation-delay: 0.2s">
        <view class="feature-item">
          <text class="fi-icon">📥</text>
          <text>导入真实聊天记录</text>
        </view>
        <view class="feature-item">
          <text class="fi-icon">🎯</text>
          <text>AI 风格特征提取与分析</text>
        </view>
        <view class="feature-item">
          <text class="fi-icon">👤</text>
          <text>创建和管理自定义角色</text>
        </view>
        <view class="feature-item">
          <text class="fi-icon">📡</text>
          <text>离线模式降级回复</text>
        </view>
      </view>

      <view class="qr-area" style="animation-delay: 0.28s">
        <text class="qr-title">下载方式</text>
        <view class="platform-list">
          <text class="platform-item">🍎 App Store（iOS）</text>
          <text class="platform-item">📱 各大应用商店（Android）</text>
          <text class="platform-item">💬 微信小程序搜索"AI 模拟对话"</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default { setup() { return {} } }
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.page {
  min-height: 100vh;
  background: linear-gradient(180deg, $ink-bg 0%, #EDECE5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.card {
  background: $ink-surface;
  border-radius: $radius-lg;
  padding: 48rpx 40rpx 40rpx;
  text-align: center;
  box-shadow: $shadow-md;
  width: 100%;
  max-width: 580rpx;
}

.card-icon-wrap {
  margin-bottom: 24rpx;
}

.big-icon {
  font-size: 100rpx;
  display: block;
  line-height: 1.2;
}

.title {
  font-size: $font-xxl;
  font-weight: 700;
  color: $ink-text;
  display: block;
  letter-spacing: 4rpx;
}

.subtitle {
  font-size: $font-lg;
  color: $ink-text-secondary;
  display: block;
  margin-top: 6rpx;
  margin-bottom: 36rpx;
}

.feature-list {
  text-align: left;
  margin-bottom: 40rpx;
  background: $ink-bg;
  border-radius: $radius-md;
  padding: 8rpx 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  font-size: $font-base;
  color: $ink-text;
  padding: 18rpx 28rpx;

  &:not(:last-child) {
    border-bottom: 1rpx solid $ink-border;
  }
}

.fi-icon {
  font-size: 32rpx;
  width: 40rpx;
  text-align: center;
}

.qr-area {
  padding: 28rpx;
  background: $ink-primary-light;
  border-radius: $radius-md;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.qr-title {
  font-size: $font-base;
  font-weight: 600;
  color: $ink-primary-dark;
}

.platform-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.platform-item {
  font-size: $font-sm;
  color: $ink-text-secondary;
  line-height: 1.5;
}
</style>
