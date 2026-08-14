# RBAC 目录 + debug/permission/role 管理页 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有四平铺 RBAC 页面重构为 RBAC 目录下三个平级管理页（debug/permission/role），侧边栏由后端 `myMenuTree` 驱动并按 `myPermissions` 二次过滤，布局合并为单一认证布局，路由保持静态。

**Architecture:** 菜单 store 保留原始树 + 前端按权限码二次过滤生成嵌套导航；布局合并为 `DefaultLayout`（侧边栏 + 面包屑 + 灵动岛 + RouterView）；`/rbac` 目录 redirect `/rbac/debug`，下挂三个静态子路由；role 页内三标签 v-show 切换。

**Tech Stack:** Vue 3.5 `<script setup>` SFC、TypeScript project references、vue-router v5、Pinia v4。验证手段仅 `npm run build`（`vue-tsc -b && vite build`，无 lint/test）。

## Global Constraints

- 全部路由**静态**写死 `src/router/index.ts`，不做动态路由
- 侧边栏菜单 = `myMenuTree` 树 + **前端二次过滤**（`permissionCode` ⊆ `userStore.permissions`；`isVisible === 'NO'` 剪掉；父级剪空整枝移除；叶子需 `routePath`；`routePath === '/'` 不纳入）
- 权限码全集：`system:rbac:debug:manage`（debug）、`system:permission:manage`（permission）、`system:role:manage`（role + 角色管理标签）、`system:role:assign`（角色授权标签）、`system:user:role:manage`（用户角色标签）
- role 页内三标签 v-show 切换，**URL 不随标签变化**
- 复用 `src/views/rbac/components/*`（ConfirmModal / PermissionCheckTree / PermissionFormModal / PermissionTreeTable / RoleFormModal / StatusTag）与 `src/views/rbac/meta.ts`，**不修改**
- `src/api/modules/rbac/*` 为生成代码，**只 import 不修改**
- 组件风格：`<script setup lang="ts">` → `<template>` → `<style scoped>`；样式 token 用 `--color-*`/`--space-*`/`--text-*`/`--radius-*`，禁十六进制；类名 BEM 简化版
- 导入分组：Vue 核心 → 第三方 → `@/` → 相对路径 → type-only → 样式
- 每次任务结束 `npm run build` 必须通过（唯一验证手段）
- 删除文件用 `git rm`；提交信息 `<type>(<scope>): <subject>`

---

### Task 1: 菜单 Store 二次过滤 + 嵌套侧边栏组件

**Files:**
- Create: `src/layouts/AppSidebarNav.vue`
- Modify: `src/layouts/AppSidebar.vue`（整体重写导航区）
- Modify: `src/stores/modules/menu.ts`（保留树 + `applyPermissions` 二次过滤）

**Interfaces:**
- Produces: `AppSidebarNav.vue` 导出 `ICONS`（图标 path 映射）与 `NavItem`（`{ label; icon; to?; children? }`）；默认导出递归导航列表组件，props `{ items: NavItem[]; compact?: boolean; depth?: number }`，emit `{ navigate: [] }`
- Produces: `useMenuStore` state `{ tree: MenuNode[] | null; navItems: NavItem[]; isLoaded: boolean }`；action `fetchMenuTree(): Promise<void>`、`applyPermissions(perms: string[]): void`；导出 `MenuNode`
- Consumes: `useUserStore`（Task 2 布局注入 perms）；`AppSidebarNav` 被 AppSidebar 消费（本任务内）

- [ ] **Step 1: 创建 `src/layouts/AppSidebarNav.vue`**

将 `ICONS` 与 `NavItem` 从 AppSidebar.vue 迁入并导出；实现递归导航（目录可展开/收起、含激活子项自动展开、compact 态只显图标）：

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute } from 'vue-router'

/** 侧边栏图标集合（inline SVG path，随 stroke 当前色）；导出供侧边栏与菜单映射共用 */
export const ICONS = {
  features: 'M4 6h16M4 12h16M4 18h10',
  reviews: 'M4 4h16v12H8l-4 4z',
  pricing: 'M12 3l7 6-7 12L5 9z',
  faq: 'M9.5 9a2.5 2.5 0 1 1 5 0c0 1.5-2 2-2 3M12 16.5h.01',
  login: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  close: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  home: 'M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  role: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21c0-3.3 3.6-6 8-6s8 2.7 8 6',
  permission: 'M12 3l7 3v5c0 4.4-3 7.4-7 9-4-1.6-7-4.6-7-9V6z',
  userrole: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6',
  grant: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  dashboard: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  logout: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
} as const

export interface NavItem {
  label: string
  icon: keyof typeof ICONS
  /** 配置后渲染为 router-link，并据此高亮当前项 */
  to?: string
  /** 子级目录项；有 children 时渲染为可展开分组 */
  children?: NavItem[]
}

const props = withDefaults(
  defineProps<{
    items: NavItem[]
    /** 图标栏收缩态：隐藏文字与子级 */
    compact?: boolean
    depth?: number
  }>(),
  { compact: false, depth: 0 },
)

const emit = defineEmits<{ navigate: [] }>()
const route = useRoute()

/** 目录展开状态表：缺省自动打开含当前激活子项的分组 */
const openMap = reactive<Map<string, boolean>>(new Map())

function isActive(to?: string): boolean {
  return !!to && (route.path === to || route.path.startsWith(`${to}/`))
}

function anyActive(nodes: NavItem[]): boolean {
  return nodes.some((n) => isActive(n.to) || (n.children?.length ? anyActive(n.children) : false))
}

function openKey(item: NavItem): string {
  return item.to ?? `${props.depth}:${item.label}`
}

function isOpen(item: NavItem): boolean {
  return openMap.get(openKey(item)) ?? anyActive(item.children ?? [])
}

function toggle(item: NavItem): void {
  openMap.set(openKey(item), !isOpen(item))
}
</script>

<template>
  <div class="nav-list" :class="{ 'is-compact': compact }">
    <template v-for="item in items" :key="item.to ?? item.label">
      <!-- 目录项：可展开 -->
      <template v-if="item.children?.length">
        <button
          type="button"
          class="nav-item nav-item--group"
          :class="{ 'is-nested': depth > 0 }"
          :title="compact ? item.label : undefined"
          @click="toggle(item)"
        >
          <svg
            class="nav-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="ICONS[item.icon]" />
          </svg>
          <span v-show="!compact" class="nav-label">{{ item.label }}</span>
          <svg
            v-show="!compact"
            class="nav-caret"
            :class="{ 'is-open': isOpen(item) }"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <AppSidebarNav
          v-if="isOpen(item) && !compact"
          :items="item.children"
          :compact="compact"
          :depth="depth + 1"
          @navigate="emit('navigate')"
        />
      </template>

      <!-- 叶子项：有路由渲染为 router-link -->
      <RouterLink
        v-else-if="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ 'is-active': isActive(item.to), 'is-nested': depth > 0 }"
        :title="compact ? item.label : undefined"
        @click="emit('navigate')"
      >
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path :d="ICONS[item.icon]" />
        </svg>
        <span v-show="!compact" class="nav-label">{{ item.label }}</span>
      </RouterLink>

      <!-- 叶子项：无路由 → 占位按钮 -->
      <button
        v-else
        type="button"
        class="nav-item"
        :class="{ 'is-nested': depth > 0 }"
        :title="compact ? item.label : undefined"
      >
        <svg
          class="nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path :d="ICONS[item.icon]" />
        </svg>
        <span v-show="!compact" class="nav-label">{{ item.label }}</span>
      </button>
    </template>
  </div>
</template>

<style scoped>
.nav-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  text-align: left;
  width: 100%;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background-color: var(--color-primary-soft);
    color: var(--color-ink);
  }

  &.is-active {
    background-color: var(--color-primary);
    color: var(--color-on-primary);
  }

  &.is-nested {
    padding-left: 18px;
    font-size: var(--text-sm);
  }
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
}

.nav-caret {
  width: 14px;
  height: 14px;
  margin-left: auto;
  flex-shrink: 0;
  color: var(--color-text-weak);
  transition: transform 0.2s ease;

  &.is-open {
    transform: rotate(90deg);
  }
}

.nav-list.is-compact .nav-item {
  justify-content: center;
  padding: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .nav-caret {
    transition: none;
  }
}
</style>
```

> 自引用：Vue 3.3+ SFC 可按文件名隐式自引用，`<AppSidebarNav>` 即自身递归。

- [ ] **Step 2: 重写 `src/layouts/AppSidebar.vue`**

移除本地 `ICONS` 常量与 `NavItem` 接口（改从 AppSidebarNav 导入），导航区改用 `<AppSidebarNav>`，保留品牌区 / 底部登出 / 移动端抽屉 / 触发按钮 / 滚动收缩逻辑：

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logout } from '@/api/modules/auth/auth'
import { clearToken } from '@/api/modules/request'
import { useUserStore } from '@/stores/modules/user'
import { useMenuStore } from '@/stores/modules/menu'
import AppSidebarNav, { ICONS, type NavItem } from './AppSidebarNav.vue'

/** 侧边栏：品牌 + 递归导航（AppSidebarNav）+ 底部登出；桌面滚动收缩，移动端抽屉 */

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const menuStore = useMenuStore()

/** 登出：登出接口失败也继续本地清理，返回公开首页 */
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

withDefaults(defineProps<{ items: NavItem[]; brand?: string }>(), {
  brand: '云岫',
})

const MOBILE_BP = '(max-width: 768px)'
const SCROLL_THRESHOLD = 80

const isScrolled = ref(false)
const isHovered = ref(false)
const isMobile = ref(false)
const drawerOpen = ref(false)

/** 折叠态：滚动后自动收缩；回顶或鼠标移入时展开 */
const collapsed = computed(() => isScrolled.value && !isHovered.value)

let mediaQuery: MediaQueryList | null = null

function handleScroll(): void {
  isScrolled.value = window.scrollY > SCROLL_THRESHOLD
}

function handleMobileChange(event: MediaQueryListEvent): void {
  isMobile.value = event.matches
  if (!event.matches) {
    drawerOpen.value = false
  }
}

onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  mediaQuery = window.matchMedia(MOBILE_BP)
  isMobile.value = mediaQuery.matches
  mediaQuery.addEventListener('change', handleMobileChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  mediaQuery?.removeEventListener('change', handleMobileChange)
})
</script>

<template>
  <!-- 桌面侧边栏：左固定 + 毛玻璃，滚动后自动收缩为图标栏 -->
  <aside
    class="sidebar"
    :class="{ 'is-collapsed': collapsed }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="sidebar__brand">
      <span class="sidebar__brand-mark">{{ brand.charAt(0) }}</span>
      <span v-show="!collapsed" class="sidebar__brand-name">{{ brand }}</span>
    </div>

    <!-- 递归导航：目录可展开，叶子 router-link 高亮 -->
    <nav class="sidebar__nav">
      <AppSidebarNav :items="items" :compact="collapsed" />
    </nav>

    <div class="sidebar__footer">
      <button type="button" class="sidebar__cta" @click="handleLogout">
        <svg
          class="sidebar__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path :d="ICONS.logout" />
        </svg>
        <span v-show="!collapsed" class="sidebar__label">登出</span>
      </button>
    </div>
  </aside>

  <!-- 移动端遮罩 -->
  <transition name="scrim">
    <div v-if="drawerOpen" class="sidebar-scrim" @click="drawerOpen = false" />
  </transition>

  <!-- 移动端抽屉 -->
  <transition name="drawer">
    <aside v-if="drawerOpen" class="sidebar-mobile">
      <div class="sidebar-mobile__head">
        <span class="sidebar__brand-name">{{ brand }}</span>
        <button
          type="button"
          class="sidebar-mobile__close"
          aria-label="关闭导航"
          @click="drawerOpen = false"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="ICONS.close" />
          </svg>
        </button>
      </div>
      <nav class="sidebar__nav">
        <AppSidebarNav :items="items" @navigate="drawerOpen = false" />
      </nav>
      <div class="sidebar-mobile__foot">
        <button type="button" class="btn btn--primary" @click="handleLogout">
          登出
        </button>
      </div>
    </aside>
  </transition>

  <!-- 移动端触发按钮 -->
  <button
    v-if="isMobile"
    type="button"
    class="sidebar-trigger"
    aria-label="打开导航"
    @click="drawerOpen = true"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path :d="ICONS.menu" />
    </svg>
  </button>
</template>

<style scoped>
/* ========== 桌面侧边栏 ========== */
.sidebar {
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
  height: 100dvh;
  width: 232px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-3);
  overflow-y: auto;
  border-right: 1px solid var(--color-border-soft);
  background-color: color-mix(in srgb, var(--color-bg) 62%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  transition: width 0.3s ease;
}

.sidebar.is-collapsed {
  width: 72px;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }
}

/* 品牌 */
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-5);
  overflow: hidden;
}

.sidebar__brand-mark {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  font-size: var(--text-lg);
}

.sidebar__brand-name {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  white-space: nowrap;
}

/* 导航区 */
.sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 底部登出 */
.sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-soft);
}

.sidebar__cta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: var(--text-base);

  &:hover {
    opacity: 0.85;
  }
}

.sidebar.is-collapsed .sidebar__cta {
  justify-content: center;
  padding: 10px;
}

.sidebar__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar__label {
  white-space: nowrap;
}

/* ========== 移动端：触发按钮 / 遮罩 / 抽屉 ========== */
.sidebar-trigger {
  position: fixed;
  top: var(--space-3);
  left: var(--space-3);
  z-index: 55;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-soft);
  background-color: color-mix(in srgb, var(--color-bg) 62%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: var(--color-ink);

  & svg {
    width: 20px;
    height: 20px;
  }
}

.sidebar-scrim {
  position: fixed;
  inset: 0;
  z-index: 56;
  background-color: color-mix(in srgb, var(--color-ink) 28%, transparent);
}

.sidebar-mobile {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 57;
  width: 280px;
  max-width: 82vw;
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  border-right: 1px solid var(--color-border-soft);
  background-color: var(--color-bg);
  overflow-y: auto;
}

.sidebar-mobile__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-1);
  margin-bottom: var(--space-5);
}

.sidebar-mobile__close {
  display: flex;
  padding: 8px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);

  & svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: var(--color-ink);
  }
}

.sidebar-mobile__foot {
  margin-top: var(--space-4);
}

/* 抽屉 / 遮罩过渡 */
.scrim-enter-active,
.scrim-leave-active {
  transition: opacity 0.25s ease;
}

.scrim-enter-from,
.scrim-leave-to {
  opacity: 0;
}

.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.3s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}

/* 尊重系统减动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .scrim-enter-active,
  .scrim-leave-active,
  .drawer-enter-active,
  .drawer-leave-active {
    transition: none;
  }
}
</style>
```

- [ ] **Step 3: 重写 `src/stores/modules/menu.ts`**

保留原始树 + 二次过滤生成嵌套导航；`NavItem` 改从 `@/layouts/AppSidebarNav` 导入：

```ts
import { defineStore } from 'pinia'
import { myMenuTree } from '@/api/modules/rbac/rbacQuery'
import type { NavItem } from '@/layouts/AppSidebarNav'

/** 菜单 Store：myMenuTree 原始树 + 前端按权限码二次过滤 → 嵌套导航项 */

/** 后端 icon 标识 → 侧边栏图标 key 映射；未知回落 menu */
const ICON_MAP: Record<string, NavItem['icon']> = {
  dashboard: 'dashboard',
  home: 'home',
  role: 'role',
  permission: 'permission',
  grant: 'grant',
  userrole: 'userrole',
  menu: 'menu',
}

/** 后端图标标识映射为侧边栏图标 key（未知回落 menu） */
function mapIcon(icon?: string | null): NavItem['icon'] {
  return (icon && ICON_MAP[icon]) || 'menu'
}

/** 菜单节点结构（PermissionVO 树，typings 中 children 为 any，此处收窄） */
export interface MenuNode {
  permissionName?: string
  routePath?: string
  icon?: string | null
  permissionCode?: string
  isVisible?: 'NO' | 'YES' | null
  children?: MenuNode[] | null
}

/**
 * 由菜单树构建嵌套导航项（二次过滤）
 * @param nodes 原始菜单树
 * @param perms 当前用户权限码集合
 * @returns 嵌套 NavItem[]
 */
function buildNav(nodes: MenuNode[] | undefined | null, perms: string[]): NavItem[] {
  if (!nodes) return []
  const items: NavItem[] = []
  for (const node of nodes) {
    if (node.isVisible === 'NO') continue
    // 前端二次过滤：节点带权限码但用户无此码 → 剪枝
    if (node.permissionCode && !perms.includes(node.permissionCode)) continue
    const children = node.children ? buildNav(node.children, perms) : []
    if (children.length) {
      // 有子级 → 目录/分组项（可展开）；即使带 routePath 也不作叶子链接
      items.push({ label: node.permissionName || '未命名', icon: mapIcon(node.icon), children })
    } else if (node.routePath && node.routePath !== '/') {
      // 叶子 → 链接项（首页根不纳入，回首页仅走登出）
      items.push({ label: node.permissionName || '未命名', icon: mapIcon(node.icon), to: node.routePath })
    }
  }
  return items
}

interface MenuState {
  /** 后端原始菜单树（面包屑层级链也消费此树） */
  tree: MenuNode[] | null
  navItems: NavItem[]
  isLoaded: boolean
}

export const useMenuStore = defineStore('menu', {
  state: (): MenuState => ({
    tree: null,
    navItems: [],
    isLoaded: false,
  }),
  actions: {
    /**
     * 拉取当前用户菜单树（原始结构，未过滤）
     * 成功置已加载标记；失败置空并抛出，由调用方 toast 提示，下次可重试
     */
    async fetchMenuTree(): Promise<void> {
      try {
        const res = await myMenuTree()
        this.tree = (res.data as MenuNode[] | undefined) ?? []
        this.isLoaded = true
      } catch (err) {
        this.tree = null
        this.navItems = []
        this.isLoaded = false
        throw err
      }
    },
    /**
     * 二次过滤：按当前用户权限码从树构建导航项
     * 由布局在 fetchMenuTree 与 fetchPermissions 都成功后调用
     * @param perms 当前用户权限码集合
     */
    applyPermissions(perms: string[]): void {
      this.navItems = buildNav(this.tree, perms)
    },
  },
})
```

- [ ] **Step 4: 构建验证**

Run: `npm run build`
Expected: `✓ built in ...ms`（`vue-tsc` 无类型错误）

- [ ] **Step 5: 提交**

```bash
git add src/layouts/AppSidebarNav.vue src/layouts/AppSidebar.vue src/stores/modules/menu.ts
git commit -m "feat(rbac): nested sidebar nav with expandable groups, menu store keeps raw tree + secondary permission filter"
```

---

### Task 2: 合并单一认证布局 DefaultLayout

**Files:**
- Create: `src/layouts/DefaultLayout.vue`
- Delete: `src/layouts/AdminLayout.vue`
- Modify: `src/router/index.ts`（`/dashboard` 与 `/rbac` 改用 DefaultLayout）
- Modify: `src/views/dashboard/index.vue`（移除重复 `fetchPermissions` 调用）

**Interfaces:**
- Consumes: `useMenuStore.fetchMenuTree()` / `applyPermissions(perms)`（Task 1）、`useUserStore.fetchPermissions()`（现有）、`AppBreadcrumb`、`ThemeIsland`、`AppSidebar`、`BaseToastHost`
- Produces: `DefaultLayout.vue` 默认导出布局组件，承载 `/dashboard` 与 `/rbac/*`

- [ ] **Step 1: 创建 `src/layouts/DefaultLayout.vue`**

将现 `DashboardLayout.vue` 重命名为 `DefaultLayout.vue`，onMounted 改为并行拉取菜单树 + 权限码，成功后二次过滤：

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppSidebar from '@/layouts/AppSidebar.vue'
import BaseToastHost from '@/components/base/BaseToastHost.vue'
import AppBreadcrumb from '@/components/business/AppBreadcrumb.vue'
import ThemeIsland from '@/components/business/ThemeIsland.vue'
import { useMenuStore } from '@/stores/modules/menu'
import { useUserStore } from '@/stores/modules/user'
import { useToast } from '@/composables/useToast'

/** 单一认证布局：侧边栏按后端菜单树渲染（前端二次过滤），顶部面包屑 + 灵动岛，内容区 RouterView */

const menuStore = useMenuStore()
const userStore = useUserStore()
const toast = useToast()

const navItems = computed(() => menuStore.navItems)

onMounted(async () => {
  try {
    await Promise.all([menuStore.fetchMenuTree(), userStore.fetchPermissions()])
    menuStore.applyPermissions(userStore.permissions)
  } catch {
    toast.error('菜单加载失败')
  }
})
</script>

<template>
  <div class="layout">
    <ThemeIsland />
    <AppSidebar :items="navItems" />

    <div class="layout__main">
      <header class="layout__head">
        <AppBreadcrumb />
      </header>
      <main class="layout__content">
        <RouterView />
      </main>
    </div>

    <BaseToastHost />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.layout__head {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-soft);
  background-color: color-mix(in srgb, var(--color-bg) 72%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.layout__content {
  flex: 1;
  padding: var(--space-6);
}

@media (max-width: 768px) {
  .layout__content {
    padding: var(--space-4);
  }

  .layout__head {
    padding-left: var(--space-4);
  }
}
</style>
```

- [ ] **Step 2: 更新 `src/router/index.ts`**

`/dashboard` 与 `/rbac` 的 component 均改为 `@/layouts/DefaultLayout.vue`；`/rbac` 子路由**本轮保持现有四个**（roles/permissions/role-permissions/user-roles，Task 6 才替换），仅父布局换新：

```ts
// 仅替换这两处 component 引用，其余不动：
{
  path: '/dashboard',
  component: () => import('@/layouts/DefaultLayout.vue'),
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
{
  path: '/rbac',
  component: () => import('@/layouts/DefaultLayout.vue'),
  redirect: '/rbac/roles',
  meta: { title: '权限管理' },
  children: [
    // 现有四个子路由保持不变（Task 6 替换）
  ],
},
```

- [ ] **Step 3: 移除 `DashboardLayout.vue` 与 `AdminLayout.vue`，更新 dashboard 页**

```bash
git rm src/layouts/AdminLayout.vue
git rm src/layouts/DashboardLayout.vue
```

`src/views/dashboard/index.vue`：`onMounted` 中删除 `void userStore.fetchPermissions()`（DefaultLayout 已统一拉取），保留 `useUserStore` 引用：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/modules/user'

/** 个人仪表盘：欢迎横幅 + 数据统计看板（静态占位）+ 最近动态 / 待办占位 */

const userStore = useUserStore()
// ... 其余 computed / statCards / recentActivities / todos 保持不变，删除 onMounted 块
</script>
```

- [ ] **Step 4: 构建验证**

Run: `npm run build`
Expected: `✓ built in ...ms`

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "refactor(layout): merge dashboard/admin into single DefaultLayout, route both areas through it"
```

---

### Task 3: debug 管理页

**Files:**
- Create: `src/views/rbac/debug/index.vue`

**Interfaces:**
- Consumes: `rbacDebug.ts`：`check(params: { id: number; permission: string })` → `RBoolean`、`effective(params: { id: number })` → `RSetString`、`evictUser(params: { id: number })` → `RInteger`、`evictBatch(params: { roleId: number; mode?: string })` → `REvictTaskVO`、`task(params: { taskId: string })` → `REvictTaskVO`；`formatTime` from `../meta`；`BaseModal`；`ConfirmModal`；`readApiErrorMessage`；`useToast`
- Produces: `/rbac/debug` 页面组件（Task 6 挂路由）

页面分区：①权限校验 ②用户生效权限 ③踢单用户 ④批量踢（async 轮询任务进度）。

- [ ] **Step 1: 创建 `src/views/rbac/debug/index.vue`**

```vue
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { check, effective, evictUser, evictBatch, task } from '@/api/modules/rbac/rbacDebug'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { formatTime } from '../meta'

/** Debug 权限排查：用户权限校验 / 生效权限 / 踢人 / 批量踢（async 轮询任务） */

const { success, error } = useToast()

/* —— 一、权限校验 —— */
const checkUserId = ref<number | null>(null)
const checkPerm = ref('')
const checkResult = ref<boolean | null>(null)
const checking = ref(false)

async function runCheck(): Promise<void> {
  if (checkUserId.value == null) {
    error('请输入用户 ID')
    return
  }
  if (!checkPerm.value.trim()) {
    error('请输入权限标识')
    return
  }
  checking.value = true
  try {
    const res = await check({ id: checkUserId.value, permission: checkPerm.value.trim() })
    checkResult.value = !!res.data
  } catch (err) {
    error(readApiErrorMessage(err, '权限校验失败'))
  } finally {
    checking.value = false
  }
}

/* —— 二、用户生效权限 —— */
const effUserId = ref<number | null>(null)
const effPerms = ref<string[]>([])
const effLoading = ref(false)
const effShown = ref(false)

async function runEffective(): Promise<void> {
  if (effUserId.value == null) {
    error('请输入用户 ID')
    return
  }
  effLoading.value = true
  effShown.value = true
  try {
    const res = await effective({ id: effUserId.value })
    effPerms.value = res.data ?? []
  } catch (err) {
    effPerms.value = []
    error(readApiErrorMessage(err, '生效权限查询失败'))
  } finally {
    effLoading.value = false
  }
}

/* —— 三、踢单用户 —— */
const evictUserId = ref<number | null>(null)
const confirmOpen = ref(false)
let confirmAction: (() => void) | null = null

function askEvictUser(): void {
  if (evictUserId.value == null) {
    error('请输入用户 ID')
    return
  }
  confirmOpen.value = true
  confirmAction = () => doEvictUser(evictUserId.value as number)
}

function runConfirm(): void {
  confirmAction?.()
  confirmAction = null
  confirmOpen.value = false
}

async function doEvictUser(id: number): Promise<void> {
  try {
    await evictUser({ id })
    success(`用户 ${id} 已踢下线`)
  } catch (err) {
    error(readApiErrorMessage(err, '踢人失败'))
  }
}

/* —— 四、批量踢（async 轮询） —— */
const batchRoleId = ref<number | null>(null)
const batchMode = ref<'sync' | 'async'>('async')
const taskOpen = ref(false)
const taskVO = ref<API.EvictTaskVO | null>(null)
const polling = ref(false)
let pollTimer: number | null = null

async function runEvictBatch(): Promise<void> {
  if (batchRoleId.value == null) {
    error('请输入角色 ID')
    return
  }
  try {
    const res = await evictBatch({ roleId: batchRoleId.value, mode: batchMode.value })
    const vo = res.data
    if (batchMode.value === 'sync') {
      success(`同步踢出完成，命中 ${vo?.kicked ?? 0} 会话`)
      return
    }
    // async：打开进度弹窗并轮询
    taskOpen.value = true
    taskVO.value = vo ?? null
    if (vo?.taskId) startPolling(vo.taskId)
  } catch (err) {
    error(readApiErrorMessage(err, '批量踢失败'))
  }
}

function startPolling(taskId: string): void {
  polling.value = true
  pollTimer = window.setInterval(async () => {
    try {
      const res = await task({ taskId })
      taskVO.value = res.data ?? null
      const status = taskVO.value?.status
      if (status === 'SUCCESS' || status === 'FAILED') {
        stopPolling()
        if (status === 'SUCCESS') success('批量踢任务完成')
        else error(`任务失败：${taskVO.value?.error ?? '未知原因'}`)
      }
    } catch {
      stopPolling()
      error('任务进度查询失败')
    }
  }, 2000)
}

function stopPolling(): void {
  polling.value = false
  if (pollTimer != null) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

onBeforeUnmount(stopPolling)
</script>

<template>
  <div class="debug-page">
    <!-- 一、权限校验 -->
    <section class="card card--debug">
      <h2 class="card--debug__title">权限校验</h2>
      <div class="card--debug__toolbar">
        <input v-model.number="checkUserId" class="input dbg-input" type="number" placeholder="用户 ID" />
        <input
          v-model="checkPerm"
          class="input dbg-input dbg-input--wide"
          type="text"
          placeholder="权限标识，如 system:role:manage"
          spellcheck="false"
        />
        <button type="button" class="btn btn--secondary" :disabled="checking" @click="runCheck">
          {{ checking ? '校验中…' : '校验' }}
        </button>
      </div>
      <p v-if="checkResult != null" class="dbg-result" :class="{ 'is-ok': checkResult }">
        {{ checkResult ? '拥有该权限' : '无该权限' }}
      </p>
    </section>

    <!-- 二、用户生效权限 -->
    <section class="card card--debug">
      <h2 class="card--debug__title">用户生效权限</h2>
      <div class="card--debug__toolbar">
        <input v-model.number="effUserId" class="input dbg-input" type="number" placeholder="用户 ID" />
        <button type="button" class="btn btn--secondary" :disabled="effLoading" @click="runEffective">
          {{ effLoading ? '查询中…' : '查询' }}
        </button>
      </div>
      <div v-if="effShown" class="dbg-chips">
        <span v-if="effLoading" class="text--weak">载入中…</span>
        <template v-else>
          <span v-for="code in effPerms" :key="code" class="tag">{{ code }}</span>
          <span v-if="!effPerms.length" class="text--weak">无生效权限</span>
        </template>
      </div>
    </section>

    <!-- 三、踢单用户 -->
    <section class="card card--debug">
      <h2 class="card--debug__title">踢单用户</h2>
      <div class="card--debug__toolbar">
        <input v-model.number="evictUserId" class="input dbg-input" type="number" placeholder="用户 ID" />
        <button type="button" class="btn btn--secondary" @click="askEvictUser">踢下线</button>
      </div>
    </section>

    <!-- 四、批量踢 -->
    <section class="card card--debug">
      <h2 class="card--debug__title">批量踢</h2>
      <div class="card--debug__toolbar">
        <input v-model.number="batchRoleId" class="input dbg-input" type="number" placeholder="角色 ID" />
        <select v-model="batchMode" class="select dbg-select">
          <option value="sync">同步</option>
          <option value="async">异步</option>
        </select>
        <button type="button" class="btn btn--primary" @click="runEvictBatch">执行</button>
      </div>
      <p class="card--debug__hint text--weak">异步模式后台执行，返回任务进度弹窗轮询；变更自动踢该角色下用户重登。</p>
    </section>

    <ConfirmModal
      :open="confirmOpen"
      title="踢用户下线"
      message="确定将该用户踢下线？写 jti 黑名单，该用户下次请求将强制重新登入。"
      danger
      @close="confirmOpen = false"
      @confirm="runConfirm"
    />

    <!-- 批量踢任务进度 -->
    <BaseModal :open="taskOpen" title="批量踢任务" @close="taskOpen = false">
      <div v-if="taskVO" class="task">
        <dl class="task__grid">
          <dt>任务 ID</dt>
          <dd class="task__mono">{{ taskVO.taskId ?? '—' }}</dd>
          <dt>来源</dt>
          <dd>{{ taskVO.sourceDesc ?? '—' }}</dd>
          <dt>状态</dt>
          <dd>{{ taskVO.status ?? '—' }}{{ polling ? '…' : '' }}</dd>
          <dt>命中会话</dt>
          <dd>{{ taskVO.kicked ?? '—' }}</dd>
          <dt>完成时间</dt>
          <dd>{{ formatTime(taskVO.doneAt) }}</dd>
        </dl>
        <p v-if="taskVO.error" class="task__error">{{ taskVO.error }}</p>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="taskOpen = false">关闭</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.debug-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.card--debug {
  padding: var(--space-5);
}

.card--debug__title {
  margin-bottom: var(--space-4);
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.06em;
}

.card--debug__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.card--debug__hint {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
}

.dbg-input {
  width: 140px;
}

.dbg-input--wide {
  width: 280px;
}

.dbg-select {
  width: 110px;
}

.dbg-result {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);

  &.is-ok {
    color: var(--color-accent-green);
  }
}

.dbg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.task__grid {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: var(--space-2) var(--space-4);
  font-size: var(--text-sm);

  dt {
    color: var(--color-text-secondary);
  }

  dd {
    color: var(--color-text);
  }
}

.task__mono {
  font-family: var(--font-mono);
}

.task__error {
  margin-top: var(--space-3);
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
```

> 说明：`batchMode` 绑定 `'sync' | 'async'`，`evictBatch` 生成代码默认 `mode: 'async'`，传 `sync` 覆盖为同步。`check` 参数 `{ id, permission }` 与 typings 一致。

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: `✓ built in ...ms`

- [ ] **Step 3: 提交**

```bash
git add src/views/rbac/debug/index.vue
git commit -m "feat(rbac): debug management page (permission check, effective perms, evict user, batch evict)"
```

---

### Task 4: permission 管理页

**Files:**
- Create: `src/views/rbac/permission/index.vue`

**Interfaces:**
- Consumes: `rbacPermission.ts`：`tree(params: { query: PermissionQueryDTO })` → `RListPermissionVO`、`create1(body: PermissionDTO)`、`update1(params: { id: number }, body: PermissionDTO)`、`delete1(params: { id: number })`、`updateStatus1(params: { id: number }, body: StatusDTO)`、`sync(params: { dryRun?: boolean })` → `RSyncReport`；复用组件 `PermissionFormModal` / `PermissionTreeTable` / `ConfirmModal`（`../components/`）；`readApiErrorMessage`；`useToast`；`BaseModal`
- Produces: `/rbac/permission` 页面组件（Task 6 挂路由）

内容与现 `src/views/rbac/permissions/index.vue` 一致（树表 + 新建/编辑/删除/启停 + 同步 dryRun 预览），仅目录层级变化。

- [ ] **Step 1: 创建 `src/views/rbac/permission/index.vue`**

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { tree, delete1, updateStatus1, sync } from '@/api/modules/rbac/rbacPermission'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/base/BaseModal.vue'
import PermissionFormModal from '../components/PermissionFormModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import PermissionTreeTable from '../components/PermissionTreeTable.vue'

/** 权限管理：权限树 + 检索 + 新建/编辑/删除/启停 + 手动同步（dryRun 预览差异） */

const { success, error } = useToast()

const loading = ref(false)
const permTree = ref<API.PermissionVO[]>([])

const filters = reactive({
  permissionName: '',
  permissionType: '' as '' | 'DIRECTORY' | 'MENU' | 'BUTTON' | 'INTERFACE',
  permissionCode: '',
})

const formOpen = ref(false)
const editingPermission = ref<API.PermissionVO | null>(null)
const editingParentName = ref('')

/* 同步差异预览 */
const syncPreview = ref<API.SyncReport | null>(null)
const syncRunning = ref(false)

/* 确认弹窗 */
const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmDanger = ref(false)
let confirmAction: (() => void) | null = null

function askConfirm(title: string, message: string, danger: boolean, action: () => void): void {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmDanger.value = danger
  confirmAction = action
  confirmOpen.value = true
}

function runConfirm(): void {
  confirmAction?.()
  confirmAction = null
  confirmOpen.value = false
}

async function fetchTree(): Promise<void> {
  loading.value = true
  try {
    const res = await tree({
      query: {
        permissionName: filters.permissionName.trim() || undefined,
        permissionType: filters.permissionType === '' ? undefined : filters.permissionType,
        permissionCode: filters.permissionCode.trim() || undefined,
      },
    })
    permTree.value = res.data ?? []
  } catch (err) {
    error(readApiErrorMessage(err, '权限树加载失败'))
  } finally {
    loading.value = false
  }
}

function openCreateRoot(): void {
  editingPermission.value = null
  editingParentName.value = ''
  formOpen.value = true
}

function openAddChild(parent: API.PermissionVO): void {
  const draft: API.PermissionVO = { parentId: parent.id, permissionName: '' }
  editingPermission.value = draft
  editingParentName.value = parent.permissionName ?? ''
  formOpen.value = true
}

function openEdit(node: API.PermissionVO): void {
  editingPermission.value = node
  editingParentName.value = findParentName(permTree.value, node.parentId)
  formOpen.value = true
}

/** 由 id 向上查找父节点名称（树渲染用） */
function findParentName(nodes: API.PermissionVO[], parentId?: number): string {
  if (!parentId) return ''
  for (const node of nodes) {
    if (node.id === parentId) return node.permissionName ?? ''
    if (node.children?.length) {
      const name = findParentName(node.children, parentId)
      if (name) return name
    }
  }
  return ''
}

function onSaved(): void {
  formOpen.value = false
  fetchTree()
}

function askDelete(node: API.PermissionVO): void {
  askConfirm(
    '删除权限',
    `确定删除「${node.permissionName}」？内置资源禁删，有角色绑定时后端会拒绝。`,
    true,
    () => doDelete(node),
  )
}

async function doDelete(node: API.PermissionVO): Promise<void> {
  try {
    await delete1({ id: node.id ?? 0 })
    success('权限已删除')
    fetchTree()
  } catch (err) {
    error(readApiErrorMessage(err, '删除失败'))
  }
}

async function toggleStatus(node: API.PermissionVO): Promise<void> {
  const next = node.status === 'NORMAL' ? 0 : 1
  try {
    await updateStatus1({ id: node.id ?? 0 }, { status: next })
    success(node.status === 'NORMAL' ? '权限已停用' : '权限已启用')
    fetchTree()
  } catch (err) {
    error(readApiErrorMessage(err, '操作失败'))
  }
}

function askSyncPreview(): void {
  askConfirm('同步权限', '同步将：新增 + 复活 + 残留停用（对比后端接口注册表）。先预览差异，确认后执行。', false, previewSync)
}

async function previewSync(): Promise<void> {
  syncRunning.value = true
  try {
    const res = await sync({ dryRun: true })
    syncPreview.value = res.data ?? null
  } catch (err) {
    error(readApiErrorMessage(err, '同步预览失败'))
  } finally {
    syncRunning.value = false
  }
}

async function executeSync(): Promise<void> {
  syncRunning.value = true
  try {
    const res = await sync({})
    const report = res.data
    success(
      `同步完成：新增 ${report?.added?.length ?? 0}，复活 ${report?.revived?.length ?? 0}，残留停用 ${report?.deprecated?.length ?? 0}，忽略 ${report?.ignored?.length ?? 0}`,
    )
    syncPreview.value = null
    fetchTree()
  } catch (err) {
    error(readApiErrorMessage(err, '同步执行失败'))
  } finally {
    syncRunning.value = false
  }
}

function reset(): void {
  filters.permissionName = ''
  filters.permissionType = ''
  filters.permissionCode = ''
  fetchTree()
}

onMounted(() => fetchTree())
</script>

<template>
  <div class="perm-page">
    <div class="card toolbar">
      <form class="toolbar__filters" novalidate @submit.prevent="fetchTree">
        <input
          v-model="filters.permissionName"
          class="input toolbar__input"
          type="text"
          placeholder="资源名称"
          spellcheck="false"
        />
        <select v-model="filters.permissionType" class="select toolbar__input">
          <option value="">全部类型</option>
          <option value="DIRECTORY">目录</option>
          <option value="MENU">菜单</option>
          <option value="BUTTON">按钮</option>
          <option value="INTERFACE">接口</option>
        </select>
        <input
          v-model="filters.permissionCode"
          class="input toolbar__input"
          type="text"
          placeholder="权限标识"
          spellcheck="false"
        />
        <button type="submit" class="btn btn--secondary" :disabled="loading">查询</button>
        <button type="button" class="btn btn--ghost" @click="reset">重置</button>
      </form>

      <div class="toolbar__actions">
        <button type="button" class="btn btn--primary" @click="openCreateRoot">新建权限</button>
        <button type="button" class="btn btn--secondary" :disabled="syncRunning" @click="askSyncPreview">
          同步
        </button>
      </div>
    </div>

    <div class="card table-card">
      <div v-if="loading && permTree.length === 0" class="table-card__empty">载入中…</div>
      <div v-else-if="permTree.length === 0" class="table-card__empty">暂无权限资源</div>
      <div v-else class="table-card__wrap">
        <table class="table">
          <thead>
            <tr>
              <th>资源名称</th>
              <th>类型</th>
              <th>权限标识</th>
              <th>状态</th>
              <th>创建时间</th>
              <th class="table__ops">操作</th>
            </tr>
          </thead>
          <tbody>
            <PermissionTreeTable
              :nodes="permTree"
              @add="openAddChild"
              @edit="openEdit"
              @del="askDelete"
              @toggle="toggleStatus"
            />
          </tbody>
        </table>
      </div>
    </div>

    <PermissionFormModal
      :open="formOpen"
      :permission="editingPermission"
      :parent-name="editingParentName"
      @close="formOpen = false"
      @saved="onSaved"
    />
    <ConfirmModal
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :danger="confirmDanger"
      @close="confirmOpen = false"
      @confirm="runConfirm"
    />

    <!-- 同步差异预览 -->
    <BaseModal :open="syncPreview !== null" title="同步差异预览" @close="syncPreview = null">
      <div class="sync-report">
        <div class="sync-report__group">
          <p class="sync-report__title sync-report__title--add">新增（{{ syncPreview?.added?.length ?? 0 }}）</p>
          <div class="sync-report__chips">
            <span v-for="c in syncPreview?.added ?? []" :key="c" class="tag">{{ c }}</span>
            <span v-if="!syncPreview?.added?.length" class="text--weak">无</span>
          </div>
        </div>
        <div class="sync-report__group">
          <p class="sync-report__title sync-report__title--revive">复活（{{ syncPreview?.revived?.length ?? 0 }}）</p>
          <div class="sync-report__chips">
            <span v-for="c in syncPreview?.revived ?? []" :key="c" class="tag">{{ c }}</span>
            <span v-if="!syncPreview?.revived?.length" class="text--weak">无</span>
          </div>
        </div>
        <div class="sync-report__group">
          <p class="sync-report__title sync-report__title--dep">残留停用（{{ syncPreview?.deprecated?.length ?? 0 }}）</p>
          <div class="sync-report__chips">
            <span v-for="c in syncPreview?.deprecated ?? []" :key="c" class="tag">{{ c }}</span>
            <span v-if="!syncPreview?.deprecated?.length" class="text--weak">无</span>
          </div>
        </div>
        <div class="sync-report__group">
          <p class="sync-report__title sync-report__title--ign">忽略告警（{{ syncPreview?.ignored?.length ?? 0 }}）</p>
          <div class="sync-report__chips">
            <span v-for="c in syncPreview?.ignored ?? []" :key="c" class="tag">{{ c }}</span>
            <span v-if="!syncPreview?.ignored?.length" class="text--weak">无</span>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn--ghost" :disabled="syncRunning" @click="syncPreview = null">
          取消
        </button>
        <button type="button" class="btn btn--primary" :disabled="syncRunning" @click="executeSync">
          {{ syncRunning ? '执行中…' : '确认执行' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.perm-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
}

.toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.toolbar__input {
  width: 150px;
}

.toolbar__actions {
  display: flex;
  gap: var(--space-2);
}

.table-card {
  padding: var(--space-4);
}

.table-card__wrap {
  overflow-x: auto;
}

.table-card__empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-weak);
  font-size: var(--text-sm);
}

.table__ops {
  white-space: nowrap;
  text-align: right;
}

.sync-report {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.sync-report__title {
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
}

.sync-report__title--add {
  color: var(--color-accent-green);
}

.sync-report__title--revive {
  color: var(--color-accent-blue);
}

.sync-report__title--dep {
  color: var(--color-danger);
}

.sync-report__title--ign {
  color: var(--color-text-weak);
}

.sync-report__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
```

> 说明：本页即现 `src/views/rbac/permissions/index.vue` 的目录迁移版（目录名 `permissions` → `permission`），逻辑一致，组件相对路径 `../components/*` 不变。

- [ ] **Step 2: 构建验证**

Run: `npm run build`
Expected: `✓ built in ...ms`

- [ ] **Step 3: 提交**

```bash
git add src/views/rbac/permission/index.vue
git commit -m "feat(rbac): permission management page (tree CRUD + manual sync)"
```

---

### Task 5: role 管理页（页内三标签）

**Files:**
- Create: `src/views/rbac/role/index.vue`（标签栏 + v-show 切换）
- Create: `src/views/rbac/role/components/RoleManage.vue`（角色管理）
- Create: `src/views/rbac/role/components/RoleGrant.vue`（角色授权）
- Create: `src/views/rbac/role/components/UserRole.vue`（用户角色）

**Interfaces:**
- Consumes: `useUserStore.permissions`（标签门控）；`rbacRole.ts` / `rbacRolePermission.ts` / `rbacUserRole.ts`（Task 6 挂路由前本页不挂路由，但组件独立编译）
- Produces: `role/index.vue` 默认导出；`RoleManage` emit `{ 'goto-auth': [roleId: number] }`；`RoleGrant` prop `{ initialRoleId?: number | null }`

三个标签组件分别从现 `src/views/rbac/roles/index.vue`、`role-permissions/index.vue`、`user-roles/index.vue` 提取，改动点为：相对导入路径加深一层（`../../components/*`、`../../meta`）、移除旧页面对 `router.push('/rbac/role-permissions')` 的导航（改 emit）、`RoleGrant` 增加 `initialRoleId` prop 自动选中。

> 标签为 **v-show 切换，URL 不随标签变化**（全局约束）。

- [ ] **Step 1: 创建 `src/views/rbac/role/index.vue`**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import RoleManage from './components/RoleManage.vue'
import RoleGrant from './components/RoleGrant.vue'
import UserRole from './components/UserRole.vue'

/** Role 管理页：页内三标签（角色管理 / 角色授权 / 用户角色），按权限码门控显隐，v-show 切换 */

const userStore = useUserStore()

/** 权限码 → 标签定义 */
const TABS = [
  { key: 'manage', label: '角色管理', code: 'system:role:manage', comp: RoleManage },
  { key: 'grant', label: '角色授权', code: 'system:role:assign', comp: RoleGrant },
  { key: 'userRole', label: '用户角色', code: 'system:user:role:manage', comp: UserRole },
] as const

/** 有权限码的可见标签 */
const visibleTabs = computed(() => TABS.filter((t) => userStore.permissions.includes(t.code)))

const active = ref<string>(TABS[0].key)
/** 角色管理页「授权」入口跳转角色授权标签时携带的角色 ID */
const grantRoleId = ref<number | null>(null)

function onGotoAuth(roleId: number): void {
  grantRoleId.value = roleId
  active.value = 'grant'
}
</script>

<template>
  <div class="role-page">
    <div v-if="!visibleTabs.length" class="card role-empty">无权限访问角色管理</div>

    <template v-else>
      <!-- 标签栏 -->
      <div class="role-tabs" role="tablist" aria-label="角色管理功能">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="role-tabs__tab"
          :class="{ 'is-active': active === tab.key }"
          @click="active = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 标签内容（v-show 切换） -->
      <section v-show="active === 'manage'" role="tabpanel">
        <RoleManage @goto-auth="onGotoAuth" />
      </section>
      <section v-show="active === 'grant'" role="tabpanel">
        <RoleGrant :initial-role-id="grantRoleId" />
      </section>
      <section v-show="active === 'userRole'" role="tabpanel">
        <UserRole />
      </section>
    </template>
  </div>
</template>

<style scoped>
.role-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.role-tabs {
  display: inline-flex;
  gap: var(--space-1);
  padding: var(--space-1);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background-color: var(--color-bg);
  align-self: flex-start;
}

.role-tabs__tab {
  padding: 6px 18px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    color: var(--color-ink);
  }

  &.is-active {
    background-color: var(--color-primary);
    color: var(--color-on-primary);
  }
}

.role-empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-weak);
  font-size: var(--text-sm);
}

@media (prefers-reduced-motion: reduce) {
  .role-tabs__tab {
    transition: none;
  }
}
</style>
```

- [ ] **Step 2: 创建 `src/views/rbac/role/components/RoleManage.vue`**

提取自 `src/views/rbac/roles/index.vue`，改动：导入路径 `../../components/ConfirmModal.vue` / `../../components/RoleFormModal.vue` / `../../components/StatusTag.vue` / `../../meta`；删除 `useRouter` 与 `gotoAuth` 的 `router.push('/rbac/role-permissions')`，改为 emit：

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  page,
  detail,
  deleteUsingDelete,
  updateStatus,
  clone,
  exportUsingGet,
  importRoles,
} from '@/api/modules/rbac/rbacRole'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import RoleFormModal from '../../components/RoleFormModal.vue'
import ConfirmModal from '../../components/ConfirmModal.vue'
import StatusTag from '../../components/StatusTag.vue'
import { DATA_SCOPE_LABEL, formatTime } from '../../meta'

/** 角色管理：分页列表 + 检索 + 新建/编辑/克隆/启停/删除 + 导入导出 + 详情；「授权」上抛 goto-auth */

const emit = defineEmits<{ 'goto-auth': [roleId: number] }>()

const { success, error } = useToast()

const loading = ref(false)
const roles = ref<API.RoleVO[]>([])
const total = ref(0)
const current = ref(1)
const size = 10

const filters = reactive({
  roleCode: '',
  roleName: '',
  status: '' as '' | 1 | 0,
})

const roleFormOpen = ref(false)
const editingRole = ref<API.RoleVO | null>(null)

const detailOpen = ref(false)
const detailRole = ref<API.RoleVO | null>(null)
const detailLoading = ref(false)

const importInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)

/* —— 确认弹窗（动态挂载回调） —— */
const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmDanger = ref(false)
let confirmAction: (() => void) | null = null

function askConfirm(title: string, message: string, danger: boolean, action: () => void): void {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmDanger.value = danger
  confirmAction = action
  confirmOpen.value = true
}

function runConfirm(): void {
  confirmAction?.()
  confirmAction = null
  confirmOpen.value = false
}

async function fetchRoles(p = current.value): Promise<void> {
  loading.value = true
  try {
    const res = await page({
      query: {
        roleCode: filters.roleCode.trim() || undefined,
        roleName: filters.roleName.trim() || undefined,
        status: filters.status === '' ? undefined : filters.status,
        page: p,
        size,
      },
    })
    const data = res.data
    roles.value = data?.records ?? []
    total.value = data?.total ?? 0
    current.value = data?.current ?? p
  } catch (err) {
    error(readApiErrorMessage(err, '角色列表加载失败'))
  } finally {
    loading.value = false
  }
}

function search(): void {
  fetchRoles(1)
}

function reset(): void {
  filters.roleCode = ''
  filters.roleName = ''
  filters.status = ''
  fetchRoles(1)
}

function openCreate(): void {
  editingRole.value = null
  roleFormOpen.value = true
}

function openEdit(role: API.RoleVO): void {
  editingRole.value = role
  roleFormOpen.value = true
}

function onSaved(): void {
  roleFormOpen.value = false
  fetchRoles()
}

async function openDetail(role: API.RoleVO): Promise<void> {
  detailOpen.value = true
  detailRole.value = null
  detailLoading.value = true
  try {
    const res = await detail({ id: role.id ?? 0 })
    detailRole.value = res.data ?? null
  } catch (err) {
    error(readApiErrorMessage(err, '角色详情加载失败'))
  } finally {
    detailLoading.value = false
  }
}

function askDelete(role: API.RoleVO): void {
  askConfirm(
    '删除角色',
    `确定删除角色「${role.roleName ?? role.roleCode}」？内置角色禁删，有关联用户时后端会拒绝。`,
    true,
    () => doDelete(role),
  )
}

async function doDelete(role: API.RoleVO): Promise<void> {
  try {
    await deleteUsingDelete({ id: role.id ?? 0 })
    success('角色已删除')
    fetchRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '删除失败'))
  }
}

function askClone(role: API.RoleVO): void {
  askConfirm(
    '克隆角色',
    `将复制「${role.roleName ?? role.roleCode}」及其全部权限绑定，编码自动生成（源 + _COPY_ + 序号）。`,
    false,
    () => doClone(role),
  )
}

async function doClone(role: API.RoleVO): Promise<void> {
  try {
    const res = await clone({ sourceRoleId: role.id ?? 0 })
    success(`克隆完成，新角色 ID：${res.data ?? ''}`)
    fetchRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '克隆失败'))
  }
}

async function toggleStatus(role: API.RoleVO): Promise<void> {
  const next = role.status === 'NORMAL' ? 0 : 1
  try {
    await updateStatus({ id: role.id ?? 0 }, { status: next })
    success(role.status === 'NORMAL' ? '角色已停用' : '角色已启用')
    fetchRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '操作失败'))
  }
}

async function handleExport(): Promise<void> {
  try {
    const res = await exportUsingGet()
    downloadJson(res.data ?? [], `roles-export-${Date.now()}.json`)
    success('角色已导出')
  } catch (err) {
    error(readApiErrorMessage(err, '导出失败'))
  }
}

async function handleImport(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  importing.value = true
  try {
    const text = await file.text()
    const res = await importRoles({}, text)
    const report = res.data
    success(
      `导入完成：新增 ${report?.added?.length ?? 0}，复活 ${report?.revived?.length ?? 0}，残留停用 ${report?.deprecated?.length ?? 0}，忽略 ${report?.ignored?.length ?? 0}`,
    )
    fetchRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '导入失败'))
  } finally {
    importing.value = false
    if (importInput.value) importInput.value.value = ''
  }
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function gotoAuth(role: API.RoleVO): void {
  if (role.id != null) emit('goto-auth', role.id)
}

onMounted(() => fetchRoles())
</script>

<template>
  <div class="role-page">
    <!-- 检索 + 操作 -->
    <div class="card toolbar">
      <form class="toolbar__filters" novalidate @submit.prevent="search">
        <input
          v-model="filters.roleCode"
          class="input toolbar__input"
          type="text"
          placeholder="角色编码"
          spellcheck="false"
        />
        <input
          v-model="filters.roleName"
          class="input toolbar__input"
          type="text"
          placeholder="角色名称"
          spellcheck="false"
        />
        <select v-model="filters.status" class="select toolbar__input">
          <option value="">全部状态</option>
          <option :value="1">启用</option>
          <option :value="0">停用</option>
        </select>
        <button type="submit" class="btn btn--secondary">查询</button>
        <button type="button" class="btn btn--ghost" @click="reset">重置</button>
      </form>

      <div class="toolbar__actions">
        <button type="button" class="btn btn--primary" @click="openCreate">新建角色</button>
        <button type="button" class="btn btn--secondary" :disabled="importing" @click="handleExport">
          导出
        </button>
        <button type="button" class="btn btn--ghost" :disabled="importing" @click="importInput?.click()">
          导入
        </button>
        <input
          ref="importInput"
          type="file"
          accept="application/json,.json"
          class="toolbar__file"
          @change="handleImport"
        />
      </div>
    </div>

    <!-- 列表 -->
    <div class="card table-card">
      <div v-if="loading && roles.length === 0" class="table-card__empty">载入中…</div>
      <div v-else-if="roles.length === 0" class="table-card__empty">暂无角色</div>
      <div v-else class="table-card__wrap">
        <table class="table">
          <thead>
            <tr>
              <th>角色编码</th>
              <th>角色名称</th>
              <th>数据权限</th>
              <th>状态</th>
              <th>内置</th>
              <th>创建时间</th>
              <th class="table__ops">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in roles" :key="role.id">
              <td class="table__code">{{ role.roleCode }}</td>
              <td>{{ role.roleName }}</td>
              <td>{{ DATA_SCOPE_LABEL[role.dataScope ?? ''] ?? role.dataScope ?? '—' }}</td>
              <td><StatusTag :status="role.status" /></td>
              <td>
                <span v-if="role.isBuiltIn === 'YES'" class="tag">内置</span>
                <span v-else class="text--weak">—</span>
              </td>
              <td class="table__time">{{ formatTime(role.createTime) }}</td>
              <td class="table__ops">
                <div class="row-ops">
                  <button type="button" class="row-op" @click="openDetail(role)">详情</button>
                  <button type="button" class="row-op" @click="openEdit(role)">编辑</button>
                  <button type="button" class="row-op" @click="gotoAuth(role)">授权</button>
                  <button type="button" class="row-op" @click="askClone(role)">克隆</button>
                  <button type="button" class="row-op" @click="toggleStatus(role)">
                    {{ role.status === 'NORMAL' ? '停用' : '启用' }}
                  </button>
                  <button type="button" class="row-op row-op--danger" @click="askDelete(role)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <BasePagination :current="current" :size="size" :total="total" @change="fetchRoles" />
    </div>

    <!-- 弹窗 -->
    <RoleFormModal :open="roleFormOpen" :role="editingRole" @close="roleFormOpen = false" @saved="onSaved" />
    <ConfirmModal
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :danger="confirmDanger"
      @close="confirmOpen = false"
      @confirm="runConfirm"
    />

    <!-- 详情 -->
    <BaseModal :open="detailOpen" title="角色详情" @close="detailOpen = false">
      <div v-if="detailLoading" class="detail-loading">载入中…</div>
      <div v-else-if="detailRole" class="detail">
        <dl class="detail__grid">
          <dt>角色编码</dt>
          <dd>{{ detailRole.roleCode }}</dd>
          <dt>角色名称</dt>
          <dd>{{ detailRole.roleName }}</dd>
          <dt>数据权限</dt>
          <dd>{{ DATA_SCOPE_LABEL[detailRole.dataScope ?? ''] ?? detailRole.dataScope ?? '—' }}</dd>
          <dt>状态</dt>
          <dd><StatusTag :status="detailRole.status" /></dd>
          <dt>备注</dt>
          <dd>{{ detailRole.remark || '—' }}</dd>
          <dt>创建时间</dt>
          <dd>{{ formatTime(detailRole.createTime) }}</dd>
        </dl>
        <div class="detail__perms">
          <p class="detail__perms-title">当前生效权限码</p>
          <div v-if="detailRole.permissionCodes?.length" class="detail__chips">
            <span v-for="code in detailRole.permissionCodes" :key="code" class="tag">{{ code }}</span>
          </div>
          <p v-else class="text--weak">无</p>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.role-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
}

.toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.toolbar__input {
  width: 150px;
}

.toolbar__actions {
  display: flex;
  gap: var(--space-2);
}

.toolbar__file {
  display: none;
}

.table-card {
  padding: var(--space-4);
}

.table-card__wrap {
  overflow-x: auto;
}

.table-card__empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-weak);
  font-size: var(--text-sm);
}

.table__code {
  font-family: var(--font-mono);
  color: var(--color-ink);
}

.table__time {
  color: var(--color-text-weak);
  white-space: nowrap;
}

.table__ops {
  white-space: nowrap;
  text-align: right;
}

.row-ops {
  display: inline-flex;
  gap: var(--space-2);
}

.row-op {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  padding: 2px 4px;

  &:hover {
    color: var(--color-primary);
  }
}

.row-op--danger:hover {
  color: var(--color-danger);
}

.detail-loading {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-weak);
}

.detail__grid {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: var(--space-2) var(--space-4);
  font-size: var(--text-sm);

  dt {
    color: var(--color-text-secondary);
  }

  dd {
    color: var(--color-text);
  }
}

.detail__perms {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-soft);
}

.detail__perms-title {
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.detail__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
```

> 说明：此为现 `roles/index.vue` 迁移版，仅导入路径改 `../../`、删 `useRouter`、`gotoAuth` 改 emit `goto-auth`。模板与样式同旧文件。

- [ ] **Step 3: 创建 `src/views/rbac/role/components/RoleGrant.vue`**

提取自 `src/views/rbac/role-permissions/index.vue`，改动：导入路径 `../../components/PermissionCheckTree.vue`、`../../meta` 不需要（本页无）；新增 `initialRoleId` prop：mount 时若传入则直接选中该角色并加载授权：

```vue
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { page as pageRoles } from '@/api/modules/rbac/rbacRole'
import { tree as treePermissions } from '@/api/modules/rbac/rbacPermission'
import { permissions, replace1 } from '@/api/modules/rbac/rbacRolePermission'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import PermissionCheckTree from '../../components/PermissionCheckTree.vue'

/** 角色授权：选角色 → 勾选权限树 → 覆盖保存（replace1 全量替换） */

const props = withDefaults(defineProps<{ initialRoleId?: number | null }>(), { initialRoleId: null })

const { success, error } = useToast()

const roles = ref<API.RoleVO[]>([])
const roleId = ref<number | null>(null)

const tree = ref<API.PermissionVO[]>([])
const checked = ref<number[]>([])
const loadingRole = ref(false)
const saving = ref(false)

async function loadRoles(): Promise<void> {
  try {
    const res = await pageRoles({ query: { size: 100 } })
    roles.value = res.data?.records ?? []
    // 角色管理「授权」入口传入的角色 ID 优先
    if (props.initialRoleId != null && roles.value.some((r) => r.id === props.initialRoleId)) {
      roleId.value = props.initialRoleId
    } else if (roles.value.length && roleId.value == null) {
      roleId.value = roles.value[0].id ?? null
    }
  } catch (err) {
    error(readApiErrorMessage(err, '角色列表加载失败'))
  }
}

async function loadAuthorization(id: number): Promise<void> {
  loadingRole.value = true
  try {
    const [treeRes, permRes] = await Promise.all([
      treePermissions({ query: {} }),
      permissions({ id }),
    ])
    tree.value = treeRes.data ?? []
    checked.value = (permRes.data ?? []).map((p) => p.id).filter((x): x is number => x != null)
  } catch (err) {
    error(readApiErrorMessage(err, '权限数据加载失败'))
  } finally {
    loadingRole.value = false
  }
}

watch(roleId, (id) => {
  if (id != null) void loadAuthorization(id)
})

const selectedRole = () => roles.value.find((r) => r.id === roleId.value)

async function save(): Promise<void> {
  if (roleId.value == null) return
  saving.value = true
  try {
    await replace1({ id: roleId.value }, { permissionIds: checked.value })
    success('角色权限已更新')
  } catch (err) {
    error(readApiErrorMessage(err, '保存失败'))
  } finally {
    saving.value = false
  }
}

onMounted(() => loadRoles())
</script>

<template>
  <div class="auth-page">
    <div class="card auth-bar">
      <div class="auth-bar__pick">
        <label class="auth-bar__label" for="role-pick">授权角色</label>
        <select id="role-pick" v-model="roleId" class="select auth-bar__select">
          <option :value="null" disabled>请选择角色</option>
          <option v-for="r in roles" :key="r.id" :value="r.id">
            {{ r.roleName ?? r.roleCode }}（{{ r.roleCode }}）
          </option>
        </select>
      </div>
      <p class="auth-bar__tip text--weak">
        已勾选 {{ checked.length }} 项；保存将全量覆盖该角色权限，变更自动踢该角色下用户重登。
      </p>
    </div>

    <div class="card auth-tree">
      <div v-if="loadingRole" class="auth-tree__empty">载入中…</div>
      <div v-else-if="!tree.length" class="auth-tree__empty">暂无权限资源</div>
      <div v-else class="auth-tree__body">
        <PermissionCheckTree v-model:checked="checked" :nodes="tree" />
      </div>

      <footer class="auth-tree__foot">
        <button
          type="button"
          class="btn btn--primary"
          :disabled="saving || roleId == null || loadingRole"
          @click="save"
        >
          {{ saving ? '保存中…' : '保存授权' }}
        </button>
        <span class="auth-tree__role text--weak">
          当前角色：{{ selectedRole()?.roleName ?? selectedRole()?.roleCode ?? '未选择' }}
        </span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
}

.auth-bar__pick {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.auth-bar__label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.auth-bar__select {
  width: 260px;
}

.auth-bar__tip {
  font-size: var(--text-xs);
}

.auth-tree {
  padding: var(--space-4);
}

.auth-tree__empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-weak);
  font-size: var(--text-sm);
}

.auth-tree__body {
  max-height: 60vh;
  overflow-y: auto;
  padding: var(--space-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
}

.auth-tree__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-4);
  margin-top: var(--space-4);
  border-top: 1px solid var(--color-border-soft);
}

.auth-tree__role {
  font-size: var(--text-xs);
}
</style>
```

- [ ] **Step 4: 创建 `src/views/rbac/role/components/UserRole.vue`**

提取自 `src/views/rbac/user-roles/index.vue`，改动：导入路径 `../../components/ConfirmModal.vue`、`../../meta`；移除 `useRoute`（原页面未用，确认即可）；其余逻辑与模板、样式逐字保留：

```vue
<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { page as pageRoles } from '@/api/modules/rbac/rbacRole'
import {
  expiring,
  renewBatch,
  userRoles,
  replace,
  unbind,
  renew,
  assignBatch,
} from '@/api/modules/rbac/rbacUserRole'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmModal from '../../components/ConfirmModal.vue'
import { formatTime, toIso, toLocalInput } from '../../meta'

/** 用户角色：按用户查角色（续期/解绑/覆盖）+ 批量授角色 + 到期预警批量续期 */
```

> 完整实现（script + template + style）照抄现 `src/views/rbac/user-roles/index.vue` 第 13-572 行，仅替换顶部 import 为：`ConfirmModal from '../../components/ConfirmModal.vue'`、`import { formatTime, toIso, toLocalInput } from '../../meta'`，其余（含 `userId`/`assignForm`/`days` 状态、`doRenew`/`doUnbind`/`doReplace`/`doAssign`/`fetchExpiring` 方法、三卡片模板、续期/覆盖/确认弹窗、全部样式）逐字不变。该文件引用 `import { page as pageRoles } from '@/api/modules/rbac/rbacRole'` 已含。

- [ ] **Step 5: 构建验证**

Run: `npm run build`
Expected: `✓ built in ...ms`

- [ ] **Step 6: 提交**

```bash
git add src/views/rbac/role
git commit -m "feat(rbac): role management page with in-page tabs (role manage/grant/user-role)"
```

---

### Task 6: 路由改嵌套 + 删除旧四页面

**Files:**
- Modify: `src/router/index.ts`（`/rbac` redirect 与子路由替换为 debug/permission/role）
- Delete: `src/views/rbac/roles/`、`src/views/rbac/permissions/`、`src/views/rbac/role-permissions/`、`src/views/rbac/user-roles/`

**Interfaces:**
- Consumes: Task 3-5 创建的三个页面组件；`DefaultLayout`（Task 2）
- Produces: 最终静态路由树

- [ ] **Step 1: 更新 `src/router/index.ts` `/rbac` 块**

将 `/rbac` 的 redirect 改为 `/rbac/debug`，子路由替换为三个新页面（保持静态 + `requiresAuth`）：

```ts
{
  path: '/rbac',
  component: () => import('@/layouts/DefaultLayout.vue'),
  redirect: '/rbac/debug',
  meta: { title: '权限管理', requiresAuth: true },
  children: [
    {
      path: 'debug',
      name: 'rbac-debug',
      component: () => import('@/views/rbac/debug/index.vue'),
      meta: { title: 'Debug 权限排查', requiresAuth: true },
    },
    {
      path: 'permission',
      name: 'rbac-permission',
      component: () => import('@/views/rbac/permission/index.vue'),
      meta: { title: '权限管理', requiresAuth: true },
    },
    {
      path: 'role',
      name: 'rbac-role',
      component: () => import('@/views/rbac/role/index.vue'),
      meta: { title: '角色管理', requiresAuth: true },
    },
  ],
},
```

- [ ] **Step 2: 删除旧四页面目录**

```bash
git rm -r src/views/rbac/roles src/views/rbac/permissions src/views/rbac/role-permissions src/views/rbac/user-roles
```

> 保留 `src/views/rbac/components/`、`src/views/rbac/meta.ts`、`src/views/rbac/debug/`、`permission/`、`role/`。

- [ ] **Step 3: 全局搜索残留引用**

Run: `grep -rn "rbac/roles\|rbac/permissions\|rbac/role-permissions\|rbac/user-roles\|views/rbac/roles\|views/rbac/permissions" src/ --include="*.vue" --include="*.ts"`
Expected: 无输出（无残留引用；`gotoAuth` 已改 emit，旧 `router.push('/rbac/role-permissions')` 已不存在）

- [ ] **Step 4: 构建验证**

Run: `npm run build`
Expected: `✓ built in ...ms`

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "refactor(rbac): static nested routes /rbac/{debug,permission,role}, remove legacy four pages"
```

---

### Task 7: 全量构建 + 文档同步

**Files:**
- Modify: `CLAUDE.md`（布局与 RBAC 页面现状同步）

- [ ] **Step 1: 全量构建**

Run: `npm run build`
Expected: `✓ built in ...ms`，无类型错误

- [ ] **Step 2: 更新 `CLAUDE.md` 相关段落**

- 「登入/注册页」下 `DefaultLayout`/`BlankLayout` 说明：改为「`DefaultLayout` 已实现：单一认证布局（侧边栏后端菜单树 + 二次权限过滤 + 面包屑 + 灵动岛），`/dashboard` 与 `/rbac/*` 共用」
- RBAC 模块说明：从「角色/权限/用户角色/角色权限/查询」更新为「debug/permission/role 三个平级管理页，挂 RBAC 目录下；侧边栏按 `myMenuTree` 渲染并前端二次过滤」
- 侧边栏 `AppSidebar.vue` 说明补「支持嵌套目录渲染」

- [ ] **Step 3: 提交**

```bash
git add CLAUDE.md
git commit -m "docs: sync layout merge and rbac page restructure in CLAUDE.md"
```

---

## 自查记录

- **Spec 覆盖**：二次过滤（Task 1 menu.ts）✓；合并布局（Task 2）✓；debug/permission/role 三页（Task 3/4/5）✓；role 三标签权限门控（Task 5）✓；静态嵌套路由（Task 6）✓；删旧四页（Task 6）✓；文档（Task 7）✓
- **占位扫描**：全部步骤含完整代码或明确「照抄现文件」引用（UserRole.vue 引用旧文件逐字迁移，且该文件在 Task 6 删除前存在，顺序安全）✓
- **类型一致**：`NavItem` 统一由 `@/layouts/AppSidebarNav` 导出；`MenuNode.permissionCode` 为 `string`；`evictBatch` 参数 `{ roleId, mode }`；`check` 参数 `{ id, permission }`；role 三标签权限码与 spec 权限码表一致 ✓
- **Task 顺序**：新页面（3-5）在旧页面删除（6）前创建并独立编译，路由替换与删除同任务原子完成，各任务构建通过 ✓
