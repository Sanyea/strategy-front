<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { logout } from '@/api/modules/auth/auth'
import { clearToken } from '@/api/modules/request'
import { useUserStore } from '@/stores/modules/user'

/** 个人仪表盘：欢迎横幅 + 数据统计看板（静态占位）+ 最近动态 / 待办占位 */

const router = useRouter()
const userStore = useUserStore()

const nickname = computed(() => userStore.user?.nickname ?? '朋友')
const username = computed(() => userStore.user?.username ?? '')

const today = computed(() => {
  const d = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日`
})

/** 统计卡片：静态演示数字，标注占位，后续接真实接口 */
const statCards = [
  { label: '可访问菜单', value: 12, tone: 'cinnabar' },
  { label: '我的权限码', value: 48, tone: 'azure' },
  { label: '系统角色', value: 6, tone: 'green' },
  { label: '角色绑定', value: 32, tone: 'cinnabar' },
]

/** 占位列表：静态演示数据 */
const recentActivities = [
  { time: '今天 09:12', text: '登入个人仪表盘' },
  { time: '昨天 17:40', text: '完成一次角色授权变更' },
  { time: '3 天前', text: '更新个人资料' },
]

const todos = [
  { text: '核对角色授权范围', done: false },
  { text: '补充手机号绑定', done: false },
  { text: '阅读权限变更说明', done: true },
]

async function handleLogout(): Promise<void> {
  try {
    await logout()
  } catch {
    // 本地退出优先：接口失败也继续清理
  } finally {
    userStore.clear()
    clearToken()
    void router.replace('/login')
  }
}

onMounted(() => {
  void userStore.fetchPermissions()
})
</script>

<template>
  <div class="dash">
    <!-- 欢迎横幅 -->
    <section class="dash__hero">
      <div class="dash__hero-seal" aria-hidden="true">欢</div>
      <div class="dash__hero-body">
        <h2 class="dash__hero-title">
          欢迎，<span class="dash__hero-name">{{ nickname }}</span>
        </h2>
        <p class="dash__hero-meta text--secondary">
          <span v-if="username">@{{ username }}</span>
          <span v-if="username" class="dash__dot" aria-hidden="true">·</span>
          <span>{{ today }}</span>
        </p>
      </div>
      <button type="button" class="btn btn--ghost dash__logout" @click="handleLogout">
        登出
      </button>
    </section>

    <!-- 数据统计看板（静态占位） -->
    <section class="dash__stats" aria-label="数据统计">
      <article
        v-for="card in statCards"
        :key="card.label"
        class="dash__stat"
        :class="`dash__stat--${card.tone}`"
      >
        <span class="dash__stat-mark" aria-hidden="true" />
        <p class="dash__stat-value">{{ card.value }}</p>
        <p class="dash__stat-label">{{ card.label }}</p>
      </article>
    </section>

    <!-- 占位区块 -->
    <div class="dash__cols">
      <section class="dash__panel">
        <h3 class="dash__panel-title">最近动态</h3>
        <ul class="dash__list">
          <li v-for="item in recentActivities" :key="item.text" class="dash__activity">
            <time class="dash__activity-time">{{ item.time }}</time>
            <span class="dash__activity-text">{{ item.text }}</span>
          </li>
        </ul>
      </section>

      <section class="dash__panel">
        <h3 class="dash__panel-title">待办事项</h3>
        <ul class="dash__list">
          <li v-for="todo in todos" :key="todo.text" class="dash__todo">
            <span class="dash__todo-check" :class="{ 'is-done': todo.done }" aria-hidden="true" />
            <span class="dash__todo-text" :class="{ 'is-done': todo.done }">{{ todo.text }}</span>
          </li>
        </ul>
      </section>
    </div>

    <p class="dash__hint text--weak">以上数据为演示占位，后续接入真实接口</p>
  </div>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  max-width: 1080px;
  margin: 0 auto;
}

/* 欢迎横幅 */
.dash__hero {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-6);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 88% 30%, color-mix(in srgb, var(--color-primary-soft) 55%, transparent) 0, transparent 46%),
    var(--color-bg);
}

.dash__hero-seal {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border: 1.5px solid var(--color-accent);
  border-radius: var(--radius-xs);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: var(--text-xl);
  transform: rotate(-6deg);
}

.dash__hero-body {
  flex: 1;
  min-width: 0;
}

.dash__hero-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  letter-spacing: 0.06em;
}

.dash__hero-name {
  color: var(--color-primary);
}

.dash__hero-meta {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
}

.dash__dot {
  margin-inline: var(--space-2);
  opacity: 0.6;
}

.dash__logout {
  flex-shrink: 0;
}

/* 统计卡片 */
.dash__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.dash__stat {
  position: relative;
  overflow: hidden;
  padding: var(--space-5);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
}

.dash__stat-mark {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  opacity: 0.75;
}

.dash__stat--cinnabar .dash__stat-mark {
  background-color: var(--color-accent);
}

.dash__stat--azure .dash__stat-mark {
  background-color: var(--color-accent-blue);
}

.dash__stat--green .dash__stat-mark {
  background-color: var(--color-accent-green);
}

.dash__stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  color: var(--color-ink);
}

.dash__stat-label {
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
}

/* 占位区块 */
.dash__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.dash__panel {
  padding: var(--space-5);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  background-color: var(--color-bg);
}

.dash__panel-title {
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.1em;
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--color-border-soft);
}

.dash__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.dash__activity {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  font-size: var(--text-sm);
}

.dash__activity-time {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-weak);
}

.dash__todo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
}

.dash__todo-check {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-xs);

  &.is-done {
    border-color: var(--color-accent-green);
    background-color: var(--color-accent-green);
    opacity: 0.8;
  }
}

.dash__todo-text.is-done {
  color: var(--color-text-weak);
  text-decoration: line-through;
}

.dash__hint {
  font-size: var(--text-xs);
  text-align: center;
}

@media (max-width: 900px) {
  .dash__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .dash__cols {
    grid-template-columns: 1fr;
  }

  .dash__hero {
    flex-wrap: wrap;
  }

  .dash__logout {
    width: 100%;
  }
}
</style>
