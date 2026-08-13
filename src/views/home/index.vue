<script setup lang="ts">
import ThemeIsland from '@/components/business/ThemeIsland.vue'

/** 云岫 · 个人工作台 落地页
 *  九模块：导航 / 首屏 / 信任条 / 功能区 / 用户评价 / 价格表 / FAQ / 行动按钮 / 页脚
 *  水墨视觉统一消费 token（src/styles/variables.css），默认方案一 mono。
 */

interface Feature {
  num: string
  title: string
  desc: string
  tags: string[]
}

interface Review {
  quote: string
  name: string
  role: string
}

interface Plan {
  name: string
  price: string
  unit: string
  desc: string
  features: string[]
  featured?: boolean
  cta: string
}

interface Faq {
  q: string
  a: string
}

const stats = [
  { value: '12万+', label: '个人用户' },
  { value: '99.9%', label: '服务可用率' },
  { value: '4.9', label: '用户评分' },
  { value: '三端', label: 'Web / 桌面 / 移动' },
]

const features: Feature[] = [
  {
    num: '壹',
    title: '效率管理',
    desc: '任务、待办、笔记、日程全聚合，一处收拢所有日常，多端实时同步。',
    tags: ['任务看板', '番茄专注', '日程提醒'],
  },
  {
    num: '贰',
    title: '数据中心',
    desc: '多维数据看板，资产、进度、统计自动汇总，一切尽在眼前。',
    tags: ['可视化图表', '自动统计', '一键导出'],
  },
  {
    num: '叁',
    title: '开发者工具',
    desc: '内置命令面板与 API 管理，日常脚本与自动化任务都收进工作台。',
    tags: ['命令面板', 'API 密钥', '定时任务'],
  },
]

const reviews: Review[] = [
  {
    quote: '早上打开一处，任务、日历、数据都在，不用再在几个 App 之间来回跳。',
    name: '陈默',
    role: '独立开发者',
  },
  {
    quote: '项目进度自动汇总成看板，汇报前不用再熬夜整理表格了。',
    name: '林晚晴',
    role: '产品经理',
  },
  {
    quote: '命令面板顺手，日常脚本和 API 调用都收进一个工作台，清爽很多。',
    name: '阿川',
    role: '运维工程师',
  },
]

const plans: Plan[] = [
  {
    name: '基础',
    price: '免费',
    unit: '',
    desc: '个人日常收拢，轻量起步',
    features: ['任务与笔记', '基础数据看板', '单设备同步'],
    cta: '免费开始',
  },
  {
    name: '专业',
    price: '¥39',
    unit: '/ 月',
    desc: '全量能力解锁，多端覆盖',
    features: ['数据中心全量', '开发者工具', '多端实时同步', '优先支持'],
    featured: true,
    cta: '选择专业版',
  },
  {
    name: '团队',
    price: '¥99',
    unit: '/ 月',
    desc: '多人协作，组织级管理',
    features: ['多人实时协作', '成员与权限', '组织数据看板'],
    cta: '联系团队',
  },
]

const faqs: Faq[] = [
  {
    q: '支持哪些设备？',
    a: 'Web、桌面端与移动端三端覆盖，数据云端同步，随时续写。',
  },
  {
    q: '数据安全如何保障？',
    a: '全链路加密传输，JWT 双令牌配合设备绑定登录，数据定期备份，密钥本地化管理。',
  },
  {
    q: '免费版与专业版的区别？',
    a: '基础版覆盖任务、笔记与基础看板；专业版解锁数据中心全量与开发者工具。',
  },
  {
    q: '可以随时取消订阅吗？',
    a: '按月订阅，随时取消；已存数据保留不丢失。',
  },
]
</script>

<template>
  <div class="page">
    <!-- 主题切换灵动岛：悬浮吸顶，滚动收缩 -->
    <ThemeIsland />

    <!-- 登录书签控件：纯视觉占位，待认证模块接入后指向登录/注册页 -->
    <button type="button" class="auth-tag" title="登录 / 注册" aria-label="登录 / 注册">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
      </svg>
    </button>

      <main>
      <!-- 首屏区 -->
      <section id="top" class="hero">
        <div class="container hero__inner">
          <div class="hero__copy">
            <span class="badge">一站式个人工作台</span>
            <h1 class="hero__title">一处收拢，全部工作</h1>
            <p class="hero__subtitle text--secondary">
              任务、笔记、日程、数据看板与开发者工具，收拢于一页。
              墨色从容，万象归心。
            </p>
            <div class="hero__actions">
              <a href="#pricing" class="btn btn--primary btn--lg">免费开始使用</a>
              <a href="#features" class="btn btn--ghost btn--lg">查看功能</a>
            </div>
          </div>

          <!-- 产品预览：水墨工作台概览 -->
          <div class="stage" aria-hidden="true">
            <div class="stage__bar">
              <span class="stage__dot" />
              <span class="stage__dot" />
              <span class="stage__dot" />
              <span class="stage__title">云岫工作台 · 概览</span>
            </div>
            <div class="stage__body">
              <div class="stage__stats">
                <div class="stage__stat">
                  <span class="stage__stat-value">5 / 8</span>
                  <span class="stage__stat-label text--weak">今日任务</span>
                </div>
                <div class="stage__stat">
                  <span class="stage__stat-value">12</span>
                  <span class="stage__stat-label text--weak">进行中</span>
                </div>
                <div class="stage__stat">
                  <span class="stage__stat-value">87%</span>
                  <span class="stage__stat-label text--weak">数据完整度</span>
                </div>
              </div>

              <div class="stage__chart">
                <svg
                  class="stage__line"
                  viewBox="0 0 320 96"
                  preserveAspectRatio="none"
                >
                  <polyline
                    class="stage__line-stroke"
                    points="0,78 40,66 80,72 120,52 160,58 200,38 240,44 280,24 320,30"
                  />
                </svg>
                <div class="stage__bars">
                  <span
                    v-for="(h, i) in [34, 52, 40, 66, 48, 72, 58, 80, 62]"
                    :key="i"
                    class="stage__bar-item"
                    :style="{ height: h + '%' }"
                  />
                </div>
              </div>

              <ul class="stage__tasks">
                <li class="stage__task">
                  <span class="stage__task-dot" />
                  <span>归档三月的周报</span>
                  <span class="text--weak">今日</span>
                </li>
                <li class="stage__task">
                  <span class="stage__task-dot" />
                  <span>同步数据看板</span>
                  <span class="text--weak">今日</span>
                </li>
                <li class="stage__task">
                  <span class="stage__task-dot" />
                  <span>整理 API 密钥</span>
                  <span class="text--weak">明日</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- 信任条 -->
      <section class="stats">
        <div class="container stats__grid">
          <div v-for="s in stats" :key="s.label" class="stats__item">
            <span class="stats__value">{{ s.value }}</span>
            <span class="stats__label text--secondary">{{ s.label }}</span>
          </div>
        </div>
      </section>

      <!-- 功能区 -->
      <section id="features" class="section container">
        <div class="section__head">
          <h2>三大能力</h2>
          <p class="text--secondary">效率、数据、开发，各司其职，又归于一处</p>
        </div>
        <div class="feature-grid">
          <article v-for="f in features" :key="f.num" class="card feature">
            <span class="feature__num">{{ f.num }}</span>
            <h3 class="feature__title">{{ f.title }}</h3>
            <p class="feature__desc text--secondary">{{ f.desc }}</p>
            <hr class="divider feature__divider" />
            <div class="feature__tags">
              <span v-for="tag in f.tags" :key="tag" class="tag">{{ tag }}</span>
            </div>
          </article>
        </div>
      </section>

      <!-- 用户评价 -->
      <section id="reviews" class="section container">
        <div class="section__head">
          <h2>用户怎么说</h2>
          <p class="text--secondary">来自真实使用者的声音</p>
        </div>
        <div class="review-grid">
          <article v-for="r in reviews" :key="r.name" class="card review">
            <span class="review__mark text--accent">「</span>
            <p class="review__quote">{{ r.quote }}</p>
            <footer class="review__footer">
              <span class="review__name">{{ r.name }}</span>
              <span class="review__role text--weak">{{ r.role }}</span>
            </footer>
          </article>
        </div>
      </section>

      <!-- 价格表 -->
      <section id="pricing" class="section container">
        <div class="section__head">
          <h2>选择你的档位</h2>
          <p class="text--secondary">从免费起步，随时升级，随时取消</p>
        </div>
        <div class="plan-grid">
          <article
            v-for="plan in plans"
            :key="plan.name"
            class="card plan"
            :class="{ 'plan--featured': plan.featured }"
          >
            <span v-if="plan.featured" class="badge plan__badge">主推</span>
            <h3 class="plan__name">{{ plan.name }}</h3>
            <p class="plan__desc text--secondary">{{ plan.desc }}</p>
            <div class="plan__price">
              <span class="plan__amount">{{ plan.price }}</span>
              <span class="plan__unit text--secondary">{{ plan.unit }}</span>
            </div>
            <hr class="divider" />
            <ul class="plan__features">
              <li v-for="f in plan.features" :key="f">{{ f }}</li>
            </ul>
            <button
              type="button"
              class="btn plan__cta"
              :class="plan.featured ? 'btn--primary' : 'btn--ghost'"
            >
              {{ plan.cta }}
            </button>
          </article>
        </div>
      </section>

      <!-- 常见问题 -->
      <section id="faq" class="section container faq">
        <div class="section__head">
          <h2>常见问题</h2>
          <p class="text--secondary">还有疑问？随时联系我们</p>
        </div>
        <div class="faq__list">
          <details v-for="f in faqs" :key="f.q" class="faq__item">
            <summary>{{ f.q }}</summary>
            <p class="faq__answer text--secondary">{{ f.a }}</p>
          </details>
        </div>
      </section>

      <!-- 行动按钮 -->
      <section class="section container">
        <div class="cta card--wash">
          <h2 class="cta__title">现在开始，收拢你的全部工作</h2>
          <p class="cta__subtitle text--secondary">免费起步，两分钟完成配置</p>
          <div class="cta__actions">
            <a href="#top" class="btn btn--primary btn--lg">免费开始使用</a>
            <button type="button" class="btn btn--ghost btn--lg">下载客户端</button>
          </div>
        </div>
      </section>
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="container footer__inner">
        <div class="footer__brand">
          <span class="footer__logo">云岫</span>
          <p class="footer__desc text--secondary">一处收拢，全部工作。</p>
        </div>
        <nav class="footer__col">
          <h4>产品</h4>
          <a href="#features">功能</a>
          <a href="#pricing">价格</a>
          <a href="#faq">常见问题</a>
        </nav>
        <nav class="footer__col">
          <h4>支持</h4>
          <a href="#">帮助中心</a>
          <a href="#">服务状态</a>
          <a href="#">反馈建议</a>
        </nav>
        <div class="footer__col">
          <h4>联系我们</h4>
          <a href="mailto:hello@yunxiu.app">hello@yunxiu.app</a>
        </div>
      </div>
      <div class="container footer__legal">
        <span class="text--weak">© 2026 云岫工作台 · 保留所有权利</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ========== 页面骨架 ========== */
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* ========== 登录书签控件：半矩形 + 底部三角裁切，纯视觉 ==========
   底色固定用点缀色（朱砂淡红），不随主题色系变化 */
.auth-tag {
  position: fixed;
  top: var(--space-3);
  left: 32px;
  z-index: 45;
  width: 52px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f7f4ed;
  background-color: #a85448;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  /* 书签式投影：略下坠，模拟悬挂质感 */
  box-shadow:
    0 8px 18px rgba(168, 84, 72, 0.28),
    0 2px 6px rgba(26, 26, 26, 0.14);
  clip-path: polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  & svg {
    width: 22px;
    height: 22px;
  }

  &:hover {
    background-color: #93493f;
    color: #f7f4ed;
  }
}

/* ========== 首屏区 ========== */
.hero {
  padding-block: var(--space-8) var(--space-7);
}

.hero__inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  align-items: center;
}

.hero__title {
  margin-top: var(--space-5);
  font-size: var(--text-hero);
  font-weight: var(--weight-bold);
  letter-spacing: 0.08em;
  line-height: 1.3;
}

.hero__subtitle {
  max-width: 460px;
  margin-top: var(--space-4);
}

.hero__actions {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

@media (max-width: 1024px) {
  .hero__inner {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }

  .hero__title {
    font-size: var(--text-display);
  }
}

@media (max-width: 600px) {
  .hero {
    padding-block: var(--space-6);
  }

  .hero__title {
    font-size: var(--text-2xl);
  }

  .hero__actions {
    flex-direction: column;
  }
}

/* 产品预览舞台 */
.stage {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background-color: color-mix(in srgb, var(--color-bg-soft) 60%, transparent);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.stage__bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border-soft);
}

.stage__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background-color: var(--color-border-soft);
}

.stage__title {
  margin-left: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.stage__body {
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.stage__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
}

.stage__stat {
  padding: var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stage__stat-value {
  font-family: var(--font-serif);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
}

.stage__stat-label {
  font-size: var(--text-xs);
}

/* 水墨线图 + 墨色柱 */
.stage__chart {
  position: relative;
  height: 120px;
}

.stage__line {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.stage__line-stroke {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 2;
  stroke-linecap: round;
  opacity: 0.7;
}

.stage__bars {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 64%;
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding-inline: var(--space-3);

  & > .stage__bar-item {
    flex: 1;
    border-radius: var(--radius-xs) var(--radius-xs) 0 0;
    background-color: var(--color-primary-soft);
  }

  & > .stage__bar-item:nth-child(even) {
    background-color: var(--color-accent-soft);
  }
}

.stage__tasks {
  display: flex;
  flex-direction: column;
}

.stage__task {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-block: var(--space-2);
  border-bottom: 1px solid var(--color-border-soft);
  font-size: var(--text-sm);

  &:last-child {
    border-bottom: none;
  }

  & > span:nth-child(2) {
    flex: 1;
    color: var(--color-text);
  }
}

.stage__task-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent);
  opacity: 0.8;
}

.stage__task:nth-child(2) .stage__task-dot {
  background-color: var(--color-accent-blue);
}

.stage__task:nth-child(3) .stage__task-dot {
  background-color: var(--color-accent-green);
}

/* ========== 信任条 ========== */
.stats {
  border-block: 1px solid var(--color-border-soft);
  background-color: var(--color-bg-soft);
  opacity: 0.92;
}

.stats__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-5);
  padding-block: var(--space-6);
}

.stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  text-align: center;
}

.stats__value {
  font-family: var(--font-serif);
  font-size: var(--text-2xl);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  letter-spacing: 0.04em;
}

.stats__label {
  font-size: var(--text-sm);
}

@media (max-width: 600px) {
  .stats__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-4);
  }
}

/* ========== 功能区 ========== */
.section__head {
  margin-bottom: var(--space-6);

  & > h2 {
    font-size: var(--text-2xl);
    letter-spacing: 0.06em;
  }

  & > p {
    margin-top: var(--space-2);
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

.feature {
  position: relative;
}

.feature__num {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  color: var(--color-accent);
  opacity: 0.75;
}

.feature__title {
  margin-top: var(--space-4);
  font-size: var(--text-lg);
  letter-spacing: 0.04em;
}

.feature__desc {
  margin-top: var(--space-3);
  font-size: var(--text-base);
}

.feature__divider {
  margin-block: var(--space-4);
}

.feature__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

@media (max-width: 1024px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
}

/* ========== 用户评价 ========== */
.review-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
}

.review__mark {
  font-family: var(--font-display);
  font-size: var(--text-display);
  line-height: 0.6;
  display: block;
  opacity: 0.7;
}

.review__quote {
  margin-top: var(--space-4);
  color: var(--color-text);
}

.review__footer {
  margin-top: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.review__name {
  font-weight: var(--weight-medium);
  color: var(--color-ink);
}

.review__role {
  font-size: var(--text-sm);
}

@media (max-width: 1024px) {
  .review-grid {
    grid-template-columns: 1fr;
  }
}

/* ========== 价格表 ========== */
.plan-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-5);
  align-items: stretch;
}

.plan {
  position: relative;
  display: flex;
  flex-direction: column;
}

.plan--featured {
  border-color: var(--color-primary);
  border-width: 1.5px;
  box-shadow: var(--shadow-soft);
}

.plan__badge {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
}

.plan__name {
  font-size: var(--text-lg);
  letter-spacing: 0.04em;
}

.plan__desc {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
}

.plan__price {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
  margin-block: var(--space-5);
}

.plan__amount {
  font-family: var(--font-serif);
  font-size: var(--text-display);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
}

.plan__unit {
  font-size: var(--text-sm);
}

.plan__features {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-block: var(--space-5);
  color: var(--color-text);
  font-size: var(--text-base);

  & > li::before {
    content: '·';
    margin-right: var(--space-2);
    color: var(--color-accent);
  }
}

.plan__cta {
  margin-top: auto;
}

@media (max-width: 1024px) {
  .plan-grid {
    grid-template-columns: 1fr;
  }
}

/* ========== 常见问题 ========== */
.faq__list {
  max-width: 720px;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.faq__item {
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  background-color: var(--color-bg);

  & summary {
    cursor: pointer;
    font-family: var(--font-serif);
    font-weight: var(--weight-medium);
    color: var(--color-ink);
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;

    &::-webkit-details-marker {
      display: none;
    }

    &::after {
      content: '+';
      font-family: var(--font-sans);
      color: var(--color-text-secondary);
      transition: transform 0.2s ease;
    }
  }

  &[open] summary::after {
    transform: rotate(45deg);
  }
}

.faq__answer {
  margin-top: var(--space-3);
  line-height: 1.8;
}

/* ========== 行动按钮 ========== */
.cta {
  text-align: center;
  padding-block: var(--space-8);
}

.cta__title {
  font-size: var(--text-2xl);
  letter-spacing: 0.06em;
}

.cta__subtitle {
  margin-top: var(--space-3);
}

.cta__actions {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
}

@media (max-width: 600px) {
  .cta__actions {
    flex-direction: column;
  }
}

/* ========== 页脚 ========== */
.footer {
  margin-top: var(--space-7);
  border-top: 1px solid var(--color-border-soft);
  background-color: var(--color-bg-soft);
  opacity: 0.94;
}

.footer__inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: var(--space-6);
  padding-block: var(--space-7);
}

.footer__logo {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
}

.footer__desc {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
}

.footer__col {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  & > h4 {
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    color: var(--color-ink);
    margin-bottom: var(--space-2);
  }

  & > a {
    font-size: var(--text-sm);
    color: var(--color-text-secondary);

    &:hover {
      color: var(--color-ink);
      opacity: 1;
    }
  }
}

.footer__legal {
  padding-block: var(--space-4);
  border-top: 1px solid var(--color-border-soft);
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .footer__inner {
    grid-template-columns: 1fr 1fr;
    gap: var(--space-6);
  }
}

@media (max-width: 480px) {
  .footer__inner {
    grid-template-columns: 1fr;
  }
}
</style>
