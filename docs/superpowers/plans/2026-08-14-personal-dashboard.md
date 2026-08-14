# 个人仪表盘页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 登入后展示的 `/dashboard` 个人仪表盘：左侧边栏按后端 `myMenuTree` 渲染，欢迎横幅 + 静态统计看板 + 占位区块，用户信息/权限码/菜单树入 Pinia。

**Architecture:** 新 `DashboardLayout` 复用现成 `AppSidebar`，`useMenuStore` 拉 `myMenuTree` 拍平为导航项；`useUserStore` 存用户信息（localStorage 水合）+ 权限码（`myPermissions`）；`router.beforeEach` 守卫受保护路由；登入/注册成功写入用户 store。

**Tech Stack:** Vue 3.5 `<script setup>` SFC、Pinia v4、vue-router v5、Vite 8、TypeScript project references、`@umijs/openapi` 生成 API。

## Global Constraints

- 组件文件名 PascalCase；页面文件语义化小写；`<style scoped>` 强制，禁全局样式
- 组件内禁写十六进制色值，一律用 `--color-*` / `--space-*` / `--text-*` / `--radius-*` token；**无 `--text-3xl`，大字用 `--text-2xl`**
- 水墨规则：底色用宣纸 token（禁纯白/纯黑），彩色（accent 系）仅小面积点缀，晕染靠透明度
- 全站唯一验证手段：`npm run build`（`vue-tsc -b && vite build`）。无 lint/test 脚本，不新增测试框架
- 提交信息 `<type>(<scope>): <subject>`；**仓库规则：每次提交后停下等人工确认，禁止自动链式 commit/merge/push**
- 代码规范：工具函数具名导出、JSDoc 公共函数、布尔值 `is/has/` 前缀、数组复数命名、禁大面积 `any`

---

### Task 1: AppSidebar 补图标（dashboard / logout）

**Files:**
- Modify: `src/layouts/AppSidebar.vue`（`ICONS` 常量，第 6-19 行）

**Interfaces:**
- Produces: `ICONS` 新增 `dashboard`、`logout` 两个 key，供 `NavItem['icon']` 使用

- [ ] **Step 1: 给 `ICONS` 追加两个图标**

`src/layouts/AppSidebar.vue` 第 6-19 行的 `const ICONS = { ... } as const` 内，末尾 `grant: '...'` 后追加两行：

```ts
  dashboard: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  logout: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
```

- [ ] **Step 2: 类型验证（build）**

Run: `npm run build`
Expected: PASS（vue-tsc 无报错，vite build 产出 `dist/`）

- [ ] **Step 3: 提交**

```bash
git add src/layouts/AppSidebar.vue
git commit -m "feat(sidebar): add dashboard/logout icons for menu mapping"
```

---

### Task 2: 用户信息存取 + 用户 Store + 菜单 Store + Pinia 注册

**Files:**
- Create: `src/utils/account.ts`
- Create: `src/stores/modules/user.ts`
- Create: `src/stores/modules/menu.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces:
  - `StoredUser`（type，`src/utils/account.ts`）：`{ username: string; nickname: string; phone?: string; email?: string }`
  - `getStoredUser(): StoredUser | null`、`setStoredUser(user: StoredUser): void`、`clearStoredUser(): void`
  - `useUserStore`（`src/stores/modules/user.ts`）：`state { user: StoredUser | null; permissions: string[] }`；`setUser(user)`、`fetchPermissions(): Promise<void>`、`clear()`
  - `useMenuStore`（`src/stores/modules/menu.ts`）：`state { navItems: NavItem[]; loaded: boolean }`；`fetchMenuTree(): Promise<void>`（失败置空并 throw）
  - `main.ts` 注册 `createPinia()`

- [ ] **Step 1: 新建 `src/utils/account.ts`**

```ts
/** 本地持久化的当前登入用户信息（登入/注册成功时写入，供刷新后水合） */

export interface StoredUser {
  username: string
  nickname: string
  phone?: string
  email?: string
}

/** localStorage 存储键 */
const STORAGE_KEY = 'strategy-front-user'

/**
 * 读取本地用户信息
 * @returns {StoredUser | null} 无记录或解析失败时返回 null
 */
export function getStoredUser(): StoredUser | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

/**
 * 写入本地用户信息
 * @param user 当前登入用户
 */
export function setStoredUser(user: StoredUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

/** 清除本地用户信息（登出时调用） */
export function clearStoredUser(): void {
  localStorage.removeItem(STORAGE_KEY)
}
```

- [ ] **Step 2: 新建 `src/stores/modules/user.ts`**

```ts
import { defineStore } from 'pinia'
import { myPermissions } from '@/api/modules/rbac/rbacQuery'
import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
  type StoredUser,
} from '@/utils/account'

/** 用户 Store：当前登入用户信息 + 权限码集合（内存态，登入后拉取） */

interface UserState {
  user: StoredUser | null
  permissions: string[]
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    // 初始化即从 localStorage 水合，避免刷新丢身份
    user: getStoredUser(),
    permissions: [],
  }),
  actions: {
    /**
     * 设置当前登入用户（同步持久化）
     * @param user 用户信息
     */
    setUser(user: StoredUser): void {
      this.user = user
      setStoredUser(user)
    },
    /**
     * 拉取当前用户权限码集（合并多角色去重后的 JWT 快照）
     * 失败时静默留空（仅告警），不阻断页面
     */
    async fetchPermissions(): Promise<void> {
      try {
        const res = await myPermissions()
        this.permissions = res.data ?? []
      } catch (err) {
        this.permissions = []
        console.warn('fetchPermissions failed:', err)
      }
    },
    /** 清空用户态（登出时调用） */
    clear(): void {
      this.user = null
      this.permissions = []
      clearStoredUser()
    },
  },
})
```

- [ ] **Step 3: 新建 `src/stores/modules/menu.ts`**

```ts
import { defineStore } from 'pinia'
import { myMenuTree } from '@/api/modules/rbac/rbacQuery'
import type { NavItem } from '@/layouts/AppSidebar.vue'

/** 菜单 Store：后端 myMenuTree → 侧边栏导航项（扁平列表） */

/** 后端 icon 标识 → AppSidebar 图标 key 映射；未知回落 menu */
const ICON_MAP: Record<string, NavItem['icon']> = {
  dashboard: 'dashboard',
  home: 'home',
  role: 'role',
  permission: 'permission',
  grant: 'grant',
  userrole: 'userrole',
  menu: 'menu',
}

/**
 * 后端图标标识映射为侧边栏图标 key
 * @param icon 后端图标字符串
 * @returns AppSidebar 图标 key（未知回落 menu）
 */
function mapIcon(icon?: string | null): NavItem['icon'] {
  return (icon && ICON_MAP[icon]) || 'menu'
}

/** 菜单节点结构（PermissionVO 树，typings 中 children 为 any，此处收窄） */
interface MenuNode {
  permissionName?: string
  routePath?: string
  icon?: string | null
  isVisible?: 'NO' | 'YES' | string | null
  children?: MenuNode[] | null
}

/** 拍平树：取可见且有 routePath 的节点，生成扁平导航项 */
function flattenMenu(nodes: MenuNode[] | undefined | null): NavItem[] {
  if (!nodes) return []
  const items: NavItem[] = []
  const walk = (list: MenuNode[]): void => {
    for (const node of list) {
      if (node.routePath && node.isVisible !== 'NO') {
        items.push({
          label: node.permissionName || '未命名',
          icon: mapIcon(node.icon),
          to: node.routePath,
        })
      }
      if (node.children) walk(node.children)
    }
  }
  walk(nodes)
  return items
}

interface MenuState {
  navItems: NavItem[]
  loaded: boolean
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    navItems: [],
    loaded: false,
  }),
  actions: {
    /**
     * 拉取当前用户菜单树并拍平为导航项
     * 失败时置空导航并抛出，由调用方 toast 提示
     */
    async fetchMenuTree(): Promise<void> {
      try {
        const res = await myMenuTree()
        this.navItems = flattenMenu(res.data as MenuNode[] | undefined)
      } catch (err) {
        this.navItems = []
        throw err
      } finally {
        this.loaded = true
      }
    },
  },
})
```

- [ ] **Step 4: `src/main.ts` 注册 Pinia**

改 `src/main.ts` 为：

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/index.css'
import App from './App.vue'
import router from './router'
import { applyWallpaper } from './utils/wallpaper'

// 挂载前随机一张水墨壁纸，写入 CSS 变量供全局 body 背景消费
applyWallpaper()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
```

- [ ] **Step 5: 类型验证（build）**

Run: `npm run build`
Expected: PASS（vue-tsc 无报错；若 `Vue Router` 类型与 `RouteRecordRaw` 冲突报错，以实际报错为准修正）

- [ ] **Step 6: 提交**

```bash
git add src/utils/account.ts src/stores/modules/user.ts src/stores/modules/menu.ts src/main.ts
git commit -m "feat(dashboard): pinia stores for user/permissions/menu-tree + account utils"
```

---

### Task 3: DashboardLayout

**Files:**
- Create: `src/layouts/DashboardLayout.vue`

**Interfaces:**
- Consumes: `useMenuStore().fetchMenuTree()`、`useMenuStore().navItems`、`useToast().error(msg)`、`AppSidebar`、`BaseToastHost`
- Produces: 布局组件，`onMounted` 拉取菜单树，`<RouterView />` 渲染子路由

- [ ] **Step 1: 新建 `src/layouts/DashboardLayout.vue`**

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/layouts/AppSidebar.vue'
import BaseToastHost from '@/components/base/BaseToastHost.vue'
import { useMenuStore } from '@/stores/modules/menu'
import { useToast } from '@/composables/useToast'

/** 个人仪表盘布局：侧边栏菜单按后端 myMenuTree 动态渲染 */

const route = useRoute()
const menuStore = useMenuStore()
const toast = useToast()

const navItems = computed(() => menuStore.navItems)
const title = computed(() => (route.meta?.title as string | undefined) ?? '')

onMounted(async () => {
  if (menuStore.loaded) return
  try {
    await menuStore.fetchMenuTree()
  } catch {
    toast.error('菜单加载失败')
  }
})
</script>

<template>
  <div class="dashboard">
    <AppSidebar :items="navItems" />

    <div class="dashboard__main">
      <header class="dashboard__head">
        <h1 class="dashboard__title">{{ title }}</h1>
      </header>
      <main class="dashboard__content">
        <RouterView />
      </main>
    </div>

    <BaseToastHost />
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
}

.dashboard__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.dashboard__head {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-soft);
  background-color: color-mix(in srgb, var(--color-bg) 72%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dashboard__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
}

.dashboard__content {
  flex: 1;
  padding: var(--space-6);
}

@media (max-width: 768px) {
  .dashboard__content {
    padding: var(--space-4);
  }

  .dashboard__head {
    padding-left: var(--space-4);
  }
}
</style>
```

- [ ] **Step 2: 类型验证（build）**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/layouts/DashboardLayout.vue
git commit -m "feat(dashboard): layout with myMenuTree-driven sidebar"
```

---

### Task 4: 仪表盘页面（欢迎横幅 + 统计看板 + 占位）

**Files:**
- Create: `src/views/dashboard/index.vue`

**Interfaces:**
- Consumes: `useUserStore().user`、`useUserStore().fetchPermissions()`、`useUserStore().clear()`、`logout()`（`@/api/modules/auth/auth`）、`clearToken()`（`@/api/modules/request`）
- Produces: 仪表盘主页组件，`onMounted` 拉权限码，含登出处理

- [ ] **Step 1: 新建 `src/views/dashboard/index.vue`**

```vue
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
    menuStore.$reset()
    clearToken()
    void router.replace('/')
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
```

- [ ] **Step 2: 类型验证（build）**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/views/dashboard/index.vue
git commit -m "feat(dashboard): welcome banner, static stats board and placeholder panels"
```

---

### Task 5: 路由 + 登入守卫

**Files:**
- Modify: `src/router/index.ts`

**Interfaces:**
- Consumes: `getToken()`（`@/api/modules/request`）、Task 3 `DashboardLayout`、Task 4 `views/dashboard/index.vue`
- Produces: `/dashboard` 路由（`meta.requiresAuth: true`）+ `router.beforeEach` 守卫

- [ ] **Step 1: 修改 `src/router/index.ts`**

`import { createRouter, createWebHistory } from 'vue-router'` 后追加 `getToken` 导入：

```ts
import { getToken } from '@/api/modules/request'
```

`home` 与 `auth` 路由之间插入 `/dashboard` 路由：

```ts
  {
    path: '/dashboard',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { title: '个人仪表盘', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '个人仪表盘', requiresAuth: true },
      },
    ],
  },
```

`createRouter({ ... })` 与 `router.afterEach` 之间插入守卫：

```ts
// 登入守卫：受保护路由需凭证；已登入访问登入页则回跳
router.beforeEach((to) => {
  const authed = Boolean(getToken())
  if (to.matched.some((record) => record.meta.requiresAuth) && !authed) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'auth' && authed) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : ''
    return redirect.startsWith('/') ? redirect : '/dashboard'
  }
})
```

- [ ] **Step 2: 类型验证（build）**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/router/index.ts
git commit -m "feat(dashboard): route with auth guard, redirect unauth to login"
```

---

### Task 6: 登入/注册接入用户 Store + 登入成功跳转

**Files:**
- Modify: `src/views/auth/components/LoginCard.vue`
- Modify: `src/views/auth/components/RegisterCard.vue`
- Modify: `src/views/auth/index.vue`

**Interfaces:**
- Consumes: `useUserStore().setUser()`（Task 2）
- Produces: 登入/注册成功时 `setUser`；`handleAuthSuccess` 跳 `/dashboard`（支持 `?redirect=`）

- [ ] **Step 1: `LoginCard.vue` 成功登入存用户**

`import { setToken } from '@/api/modules/request'` 后加：

```ts
import { useUserStore } from '@/stores/modules/user'
```

`import AuthMethodSelect from './AuthMethodSelect.vue'` 后加：

```ts
const userStore = useUserStore()
```

`submitLogin` 内 `if (res.data) setToken(res.data)` 后加一行：

```ts
    userStore.setUser({ username: account.value.trim(), nickname: account.value.trim() })
```

`submitMfa` 内 `if (res.data) setToken(res.data)` 后加同样一行：

```ts
    userStore.setUser({ username: account.value.trim(), nickname: account.value.trim() })
```

- [ ] **Step 2: `RegisterCard.vue` 注册成功存用户**

`import { setToken } from '@/api/modules/request'` 后加：

```ts
import { useUserStore } from '@/stores/modules/user'
```

`import AuthMethodSelect from './AuthMethodSelect.vue'` 后加：

```ts
const userStore = useUserStore()
```

`submitRegister` 内 `if (res.data) setToken(res.data)` 后加：

```ts
    userStore.setUser({
      username: form.username.trim(),
      nickname: form.nickname.trim() || form.username.trim(),
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
    })
```

- [ ] **Step 3: `auth/index.vue` 登入成功跳 `/dashboard`（支持 redirect）**

`import { useRouter } from 'vue-router'` 改加 `useRoute`：

```ts
import { useRoute, useRouter } from 'vue-router'
```

`const router = useRouter()` 后加：

```ts
const route = useRoute()
```

`handleAuthSuccess` 整体替换为：

```ts
function handleAuthSuccess(): void {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
  void router.replace(redirect && redirect.startsWith('/') ? redirect : '/dashboard')
}
```

- [ ] **Step 4: 类型验证（build）**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/views/auth/components/LoginCard.vue src/views/auth/components/RegisterCard.vue src/views/auth/index.vue
git commit -m "feat(auth): persist user to store on login/register, redirect to dashboard"
```

---

### Task 7: 端到端手动核对（登出 + 全流程）

**Files:**
- 无（仅验证）

- [ ] **Step 1: 起后端与前端**

起后端（Spring Boot，端口 8080，提供 `/v3/api-docs` 与 rbac 接口），再 `npm run dev`。

- [ ] **Step 2: 守卫验证**

浏览器访问 `http://localhost:5173/dashboard`（未登入）
Expected: 重定向 `/login?redirect=%2Fdashboard`

- [ ] **Step 3: 登入验证**

登入账号密码（若后端开启 MFA 则补验证码）
Expected: 跳转 `/dashboard`（有 redirect 则回原地址）；欢迎横幅显示 `欢迎，{{账号}}`；侧边栏渲染 `myMenuTree` 返回的菜单（`role` 等图标正确，未知 icon 回落 `menu`）

- [ ] **Step 4: 页面内容验证**

Expected: 4 张统计卡片、最近动态、待办事项渲染正常；刷新页面后欢迎横幅身份不丢（localStorage 水合）

- [ ] **Step 5: 登出验证**

点「登出」
Expected: 调 `/auth/logout`，清凭证与用户 store，回 `/login`；再访问 `/dashboard` 被重定向

## Self-Review 结果

- 规格覆盖：路由+守卫 ✓（Task 5）、myMenuTree 侧边栏 ✓（Task 2/3）、欢迎身份本地存取 ✓（Task 2/6）、统计静态占位 ✓（Task 4）、Pinia 用户/权限/菜单 ✓（Task 2）、登出 ✓（Task 4）、登入跳转 ✓（Task 6）
- 占位符扫描：无 TBD/TODO，所有代码步骤含完整代码
- 类型一致性：`StoredUser`/`useUserStore`/`useMenuStore`/`NavItem['icon']` 跨任务签名一致；`--text-3xl` 不存在，统一用 `--text-2xl`
- 无测试框架（CLAUDE.md），TDD 以 `npm run build` 类型检查 + 手动核对（Task 7）替代

## Execution Notes（执行后修正，2026-08-14）

评审与最终审查中确认的偏差/修复，均经人工裁决：

1. **开放重定向加固（Task 5/6，人工裁决采纳）**：两处 redirect 判断从 `startsWith('/')` 改为 `startsWith('/') && !startsWith('//')`，堵协议相对 URL（`//evil.com`）绕过。涉及 `src/router/index.ts` 守卫 与 `src/views/auth/index.vue` `handleAuthSuccess`。
2. **菜单跨账号残留（最终审查 Important）**：`useMenuStore` 字段 `loaded` 更名 `isLoaded`；`fetchMenuTree` 仅在成功后置 `isLoaded = true`，失败置 `false` 并重抛（下次挂载可重试）；登出时 `handleLogout` 调 `menuStore.$reset()` 防上一账号菜单泄漏。
3. **导航重复 key（最终审查 Important）**：`AppSidebar.vue` 两处导航循环 `:key="item.label"` 改 `:key="item.to ?? item.label"`，防后端同名菜单冲突。
4. **`MenuNode.isVisible` 联合收紧**：`'NO' | 'YES' | string | null` → `'NO' | 'YES' | null`。
5. 延后项（Minor，未在本计划内处理）：logout 图标 path 与 login 相同（计划强制，当前未被消费）；登出无防重复点击；`getStoredUser` 不验 shape；空 `<h1>` 兜底；type-only import 排序。建议：后续加 404 catch-all 路由与全局 401 处理（后端菜单可能指向未注册前端路由）。
