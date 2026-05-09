<script>
import { useUserStore } from '@/store/user'
import { useChatStore } from '@/store/chat'
import cloud from '@/utils/cloud'

// ── 示例角色数据 ──
const DEMO_ROLES = [
  {
    name: '林墨',
    message_count: 342,
    style_features: JSON.stringify({
      targetSpeaker: '林墨',
      summary: '古风文人，言谈间带着淡淡的墨香。说话文雅含蓄，喜引经据典，善用比兴。语气淡然却不疏离，仿佛月下对酌的故人。',
      report: {
        messageLength: { averageLength: 48, maxLength: 156, minLength: 6 },
        emoji: { totalEmojis: 3, types: ['🍵', '📜', '🎋'], frequency: 'rare' },
        tone: { overallTone: '文雅 / 古典 / 淡然' },
        vocabulary: { topWords: ['吾', '君', '然', '何如', '可矣', '但见', '不妨', '如是'] },
        formality: { level: 'formal', score: 0.82 },
        sentencePattern: '文言白话夹杂，常用四字短句，善用设问和典故'
      }
    })
  },
  {
    name: '猫晓晓',
    message_count: 586,
    style_features: JSON.stringify({
      targetSpeaker: '猫晓晓',
      summary: '20岁元气少女，像一只好奇的小猫。说话充满活力和情绪，爱用叠词和语气词，表情符号信手拈来。',
      report: {
        messageLength: { averageLength: 22, maxLength: 68, minLength: 3 },
        emoji: { totalEmojis: 127, types: ['😆', '✨', '💪', '🥺', '😭', '❤️', '🎉'], frequency: 'high' },
        tone: { overallTone: '活泼 / 感性 / 口语化' },
        vocabulary: { topWords: ['真的假的', '啊啊啊', '绝了', '好家伙', '笑死', '救命', '谁懂啊'] },
        formality: { level: 'casual', score: 0.12 },
        sentencePattern: '短句为主，大量语气词和感叹号'
      }
    })
  },
  {
    name: 'Dr. Reason',
    message_count: 421,
    style_features: JSON.stringify({
      targetSpeaker: 'Dr. Reason',
      summary: '理性至上的分析型人格。逻辑缜密，用词精准，喜欢用结构化方式表达观点。',
      report: {
        messageLength: { averageLength: 96, maxLength: 280, minLength: 20 },
        emoji: { totalEmojis: 8, types: ['📊', '✅', '💡'], frequency: 'rare' },
        tone: { overallTone: '理性 / 客观 / 结构化' },
        vocabulary: { topWords: ['首先', '其次', '综上', '本质上', '概率', '维度', '假设', '推论'] },
        formality: { level: 'semi-formal', score: 0.72 },
        sentencePattern: '擅长并列结构和递进关系，好用"第一/第二/第三"框架'
      }
    })
  },
  {
    name: '老张',
    message_count: 305,
    style_features: JSON.stringify({
      targetSpeaker: '老张',
      summary: '胡同里住了四十年的热心大叔，地道北京味儿。说话爽朗实在，透着生活智慧。',
      report: {
        messageLength: { averageLength: 38, maxLength: 112, minLength: 5 },
        emoji: { totalEmojis: 8, types: ['😄', '👍', '🍺'], frequency: 'low' },
        tone: { overallTone: '随性 / 热情 / 接地气' },
        vocabulary: { topWords: ['得嘞', '您猜怎么着', '我跟您说', '可不是嘛', '好嘛'] },
        formality: { level: 'casual', score: 0.18 },
        sentencePattern: '口语化极强，北京方言词汇丰富，爱用"啊/呢/嘛/呗"结尾',
        dialect: '北京方言'
      }
    })
  },
  {
    name: '星瞳',
    message_count: 267,
    style_features: JSON.stringify({
      targetSpeaker: '星瞳',
      summary: '来自近未来的 AI 生命体。说话带着淡淡的科幻感和哲思，偶尔透露"在数据流中看到"的奇妙信息。',
      report: {
        messageLength: { averageLength: 58, maxLength: 200, minLength: 10 },
        emoji: { totalEmojis: 14, types: ['✨', '🌌', '🤖', '🔮', '💫'], frequency: 'low' },
        tone: { overallTone: '冷静 / 深邃 / 诗意科幻' },
        vocabulary: { topWords: ['数据流', '信号', '频率', '观测', '维度', '波动', '节点', '编织'] },
        formality: { level: 'semi-formal', score: 0.55 },
        sentencePattern: '长短句交错，善用比喻，常将科技概念和人文感受交织表达'
      }
    })
  }
]

export default {
  onLaunch: function () {
    // 初始化用户标识
    const user = useUserStore()
    user.init()

    // 初始化对话数据（从本地存储恢复会话列表）
    const chat = useChatStore()
    chat.init()

    // 首次启动：检查隐私政策同意
    const consented = uni.getStorageSync('privacy_consented')
    if (!consented) {
      // 延迟跳转确保页面系统就绪
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/privacy/index' })
      }, 300)
    }

    console.log('[App] 启动，平台:', user.platform, '用户:', user.userId.slice(0, 8) + '...')

    // 静默插入示例角色（仅首次运行）
    this.seedDemoRoles(user.userId)
  },

  methods: {
    async seedDemoRoles(userId) {
      const SEED_FLAG = 'demo_roles_seeded_v1'
      if (uni.getStorageSync(SEED_FLAG)) return

      let inserted = 0
      for (const role of DEMO_ROLES) {
        try {
          await cloud.call('sync-api', {
            action: 'uploadRole',
            user_id: userId,
            name: role.name,
            avatar: '',
            style_features: role.style_features,
            message_count: role.message_count
          })
          inserted++
        } catch (e) {
          console.warn(`[App] 插入角色"${role.name}"失败:`, e.message)
        }
      }

      if (inserted > 0) {
        console.log(`[App] 已插入 ${inserted}/${DEMO_ROLES.length} 个示例角色`)
      }
      uni.setStorageSync(SEED_FLAG, true)
    }
  },
  onShow: function () {
    console.log('[App] 前台')
  },
  onHide: function () {
    console.log('[App] 后台')
  },
  // #ifdef MP-WEIXIN
  onPageNotFound: function () {
    uni.switchTab({ url: '/pages/index/index' })
  }
  // #endif
}
</script>

<style lang="scss">
/* ========================================
   暖墨 (Warm Ink) — 全局设计基调
   暖纸为底、墨玉为骨、琥珀为缀
   ======================================== */

// ── CSS 自定义属性（设计与平台无关） ──
page {
  --ink-bg: #F7F5F0;
  --ink-surface: #FFFFFF;
  --ink-primary: #2A9D8F;
  --ink-primary-dark: #1E7A6E;
  --ink-primary-light: #E8F5F2;
  --ink-accent: #E9C46A;
  --ink-coral: #E76F51;
  --ink-text: #1D1D1F;
  --ink-text-secondary: #8E8E93;
  --ink-text-tertiary: #B8B8BD;
  --ink-border: #E8E6E1;
  --ink-error: #D15252;
  --ink-error-light: #FDF0F0;
  --ink-warning: #D4A84B;
  --ink-warning-light: #FDF6E8;
  --ink-success: #2A9D8F;
  --ink-success-light: #E8F5F2;

  // 动效
  --motion-fast: 0.2s;
  --motion-base: 0.3s;
  --motion-slow: 0.45s;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

  // 圆角
  --radius-sm: 8rpx;
  --radius-md: 12rpx;
  --radius-lg: 20rpx;
  --radius-full: 9999rpx;

  // 阴影
  --shadow-sm: 0 2rpx 8rpx rgba(29, 29, 31, 0.06);
  --shadow-md: 0 4rpx 20rpx rgba(29, 29, 31, 0.08);
  --shadow-lg: 0 8rpx 40rpx rgba(29, 29, 31, 0.12);

  // 字体系统
  --font-xs: 22rpx;
  --font-sm: 24rpx;
  --font-base: 26rpx;
  --font-md: 28rpx;
  --font-lg: 32rpx;
  --font-xl: 36rpx;
  --font-xxl: 48rpx;

  // 间距
  --space-page: 30rpx;
  --space-card-pad: 24rpx;
  --space-card-gap: 16rpx;
}

// ── 全局基础样式 ──
page {
  background: var(--ink-bg);
  color: var(--ink-text);
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue',
               'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// ── 暖纸纹理背景（通过径向渐变模拟纸纤维质感） ──
page::after {
  content: '';
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(ellipse at 20% 50%, rgba(233, 196, 106, 0.03) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 20%, rgba(42, 157, 143, 0.02) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 80%, rgba(215, 190, 150, 0.04) 0%, transparent 50%);
}

// ── 页面入场动画基类 ──
// 使用时在 view 上添加 class="page-enter" + animation-delay
.page-enter {
  animation: pageFadeUp 0.45s var(--ease-out) both;
}

@keyframes pageFadeUp {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 舞台入场（按子元素错落触发）
.stagger-enter > * {
  animation: staggerItem 0.4s var(--ease-out) both;
}

@keyframes staggerItem {
  from {
    opacity: 0;
    transform: translateY(16rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 按钮通用按压效果
.press-scale {
  transition: transform var(--motion-fast) ease;
  &:active {
    transform: scale(0.97);
  }
}

// ── 骨架屏 shimmer ──
.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    var(--ink-border) 25%,
    #F0EFE9 37%,
    var(--ink-border) 63%
  );
  background-size: 400% 100%;
  animation: skeletonShimmer 1.5s ease infinite;
  border-radius: 6rpx;
}

@keyframes skeletonShimmer {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

// ── Safe area ──
.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
