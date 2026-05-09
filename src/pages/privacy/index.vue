<template>
  <view class="page">
    <view class="privacy-wrap page-enter">
      <!-- 顶栏 -->
      <view class="header">
        <view class="header-icon">🔒</view>
        <text class="header-title">隐私政策与数据使用</text>
        <text class="header-sub">您的数据安全由您掌控</text>
      </view>

      <!-- 三層数据策略卡片 -->
      <view class="strategy-section">
        <text class="section-title">数据存储策略</text>
        <text class="section-desc">我们采用分层存储，确保您的原始数据隐私安全</text>

        <view class="tier-card tier-local" style="animation-delay: 0.08s">
          <view class="tier-badge">仅本地</view>
          <view class="tier-header">
            <text class="tier-icon">📱</text>
            <view class="tier-info">
              <text class="tier-name">原始聊天记录</text>
              <text class="tier-detail">永不上传云端</text>
            </view>
          </view>
          <text class="tier-desc">您导入的聊天记录仅在设备本地处理，用于提取风格特征。分析完成后即可删除，我们不会以任何形式上传原始内容。</text>
        </view>

        <view class="tier-card tier-cloud" style="animation-delay: 0.16s">
          <view class="tier-badge">云端持久化</view>
          <view class="tier-header">
            <text class="tier-icon">🎨</text>
            <view class="tier-info">
              <text class="tier-name">风格特征</text>
              <text class="tier-detail">不可逆转换，用于生成回复</text>
            </view>
          </view>
          <text class="tier-desc">从您的聊天记录中提取的语言风格特征（如用词习惯、语气、表情偏好等）会加密存储在云端。这些特征是<text class="highlight">不可逆的</text>，无法还原为原始聊天内容。</text>
        </view>

        <view class="tier-card tier-cloud" style="animation-delay: 0.24s">
          <view class="tier-badge">云端持久化</view>
          <view class="tier-header">
            <text class="tier-icon">💬</text>
            <view class="tier-info">
              <text class="tier-name">对话历史</text>
              <text class="tier-detail">跨端同步，随时继续</text>
            </view>
          </view>
          <text class="tier-desc">您与 AI 角色的对话记录会存储在云端，以便在 App 和小程序之间同步，随时继续之前的对话。</text>
        </view>
      </view>

      <!-- 承诺清单 -->
      <view class="promises stagger-enter">
        <view class="promise-item">
          <text class="promise-icon">✓</text>
          <text class="promise-text">我们不会出售您的个人数据</text>
        </view>
        <view class="promise-item">
          <text class="promise-icon">✓</text>
          <text class="promise-text">您可以随时请求删除云端数据</text>
        </view>
        <view class="promise-item">
          <text class="promise-icon">✓</text>
          <text class="promise-text">未经同意，不会收集任何信息</text>
        </view>
      </view>

      <!-- 同意按钮 -->
      <view class="consent-area safe-bottom">
        <view class="consent-agreement">
          <view
            class="checkbox"
            :class="{ checked: agreed }"
            @click="agreed = !agreed"
          >
            <text v-if="agreed" class="check-mark">✓</text>
          </view>
          <text class="agreement-text">
            我已阅读并同意
            <text class="link" @click="showFullPolicy">隐私政策</text>
          </text>
        </view>

        <view
          class="consent-btn"
          :class="{ disabled: !agreed }"
          @click="onConsent"
        >
          <text class="btn-label">确认并继续</text>
          <text class="btn-arrow">→</text>
        </view>

        <text class="consent-hint">您随时可以在「设置」中撤回同意</text>
      </view>
    </view>
  </view>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const agreed = ref(false)

    function onConsent() {
      if (!agreed.value) return
      uni.setStorageSync('privacy_consented', 'true')
      uni.showToast({ title: '感谢您的信任', icon: 'none', duration: 1500 })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/index/index' })
      }, 600)
    }

    function showFullPolicy() {
      uni.showModal({
        title: '隐私政策全文',
        content: `本应用（"AI 模拟对话"）高度重视您的隐私。\n\n` +
          `1. 数据收集与使用\n` +
          `本应用因功能需要，会处理以下数据：\n` +
          `• 聊天记录：仅本地处理，用于提取风格特征，永不上传云端\n` +
          `• 风格特征：加密存储于云端，用于 AI 回复生成和跨端同步\n` +
          `• 对话历史：存储于云端，用于跨端同步\n\n` +
          `2. 数据安全\n` +
          `我们采用行业标准加密措施保护您的数据。\n\n` +
          `3. 您的权利\n` +
          `您可以随时请求删除云端数据，撤回同意，或通过设置页面联系我们。\n\n` +
          `4. 政策更新\n` +
          `本政策如有更新，我们会通过 App 内通知告知您。`,
        showCancel: false
      })
    }

    return { agreed, onConsent, showFullPolicy }
  }
}
</script>

<style lang="scss" scoped>
@use '../../components/common/variables' as *;

.page {
  min-height: 100vh;
  background: var(--ink-bg);
}

.privacy-wrap {
  padding: 0 24rpx 60rpx;
}

// ── 顶栏 ──
.header {
  text-align: center;
  padding: 64rpx 40rpx 40rpx;
}

.header-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.header-title {
  font-size: var(--font-xxl);
  font-weight: 700;
  color: var(--ink-text);
  display: block;
  letter-spacing: 2rpx;
}

.header-sub {
  font-size: var(--font-sm);
  color: var(--ink-text-secondary);
  margin-top: 8rpx;
  display: block;
}

// ── 策略区 ──
.strategy-section {
  margin-bottom: 32rpx;
}

.section-title {
  font-size: var(--font-lg);
  font-weight: 700;
  color: var(--ink-text);
  display: block;
  margin-bottom: 6rpx;
}

.section-desc {
  font-size: var(--font-sm);
  color: var(--ink-text-secondary);
  display: block;
  margin-bottom: 20rpx;
}

// ── Tier 卡片 ──
.tier-card {
  position: relative;
  background: var(--ink-surface);
  border-radius: var(--radius-md);
  padding: 28rpx;
  margin-bottom: 16rpx;
  animation: tierIn 0.45s var(--ease-out) both;
  border-left: $binding-width solid transparent;

  &.tier-local {
    border-left-color: var(--ink-primary);
  }

  &.tier-cloud {
    border-left-color: var(--ink-accent);
  }
}

@keyframes tierIn {
  from { opacity: 0; transform: translateX(-16rpx); }
  to { opacity: 1; transform: translateX(0); }
}

.tier-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  border-radius: var(--radius-full);
  font-weight: 500;

  .tier-local & {
    background: var(--ink-primary-light);
    color: var(--ink-primary);
  }

  .tier-cloud & {
    background: var(--ink-warning-light);
    color: var(--ink-warning);
  }
}

.tier-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.tier-icon {
  font-size: 40rpx;
  width: 48rpx;
  text-align: center;
}

.tier-info {
  flex: 1;
}

.tier-name {
  font-size: var(--font-md);
  font-weight: 600;
  color: var(--ink-text);
  display: block;
}

.tier-detail {
  font-size: var(--font-xs);
  color: var(--ink-text-secondary);
  display: block;
  margin-top: 2rpx;
}

.tier-desc {
  font-size: var(--font-sm);
  color: var(--ink-text-secondary);
  line-height: 1.7;
  display: block;
}

.highlight {
  color: var(--ink-primary);
  font-weight: 500;
}

// ── 承诺清单 ──
.promises {
  background: var(--ink-primary-light);
  border-radius: var(--radius-md);
  padding: 24rpx 28rpx;
  margin-bottom: 32rpx;
}

.promise-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 8rpx 0;
}

.promise-icon {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: var(--ink-primary);
  color: #fff;
  text-align: center;
  line-height: 36rpx;
  font-size: 20rpx;
  flex-shrink: 0;
  font-weight: 700;
}

.promise-text {
  font-size: var(--font-sm);
  color: var(--ink-text);
}

// ── 同意区域 ──
.consent-area {
  text-align: center;
}

.consent-agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border-radius: 6rpx;
  border: 2rpx solid var(--ink-border);
  background: var(--ink-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--motion-fast) ease;

  &.checked {
    background: var(--ink-primary);
    border-color: var(--ink-primary);
  }
}

.check-mark {
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.agreement-text {
  font-size: var(--font-sm);
  color: var(--ink-text-secondary);
}

.link {
  color: var(--ink-primary);
  font-weight: 500;
  text-decoration: underline;
}

.consent-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 88rpx;
  background: linear-gradient(135deg, var(--ink-primary), var(--ink-primary-dark));
  color: #fff;
  border-radius: var(--radius-md);
  font-size: var(--font-md);
  font-weight: 600;
  letter-spacing: 2rpx;
  transition: opacity var(--motion-fast) ease;
  box-shadow: 0 4rpx 16rpx rgba(42, 157, 143, 0.25);

  &:active:not(.disabled) {
    transform: scale(0.97);
  }

  &.disabled {
    opacity: 0.45;
  }
}

.btn-arrow {
  font-size: 28rpx;
  transition: transform var(--motion-fast) ease;
}

.consent-btn:not(.disabled):active .btn-arrow {
  transform: translateX(6rpx);
}

.consent-hint {
  display: block;
  margin-top: 16rpx;
  font-size: 20rpx;
  color: var(--ink-text-tertiary);
}
</style>
