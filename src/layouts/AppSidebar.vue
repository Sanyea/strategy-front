<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

/** 图标集合（inline SVG path，随 stroke 当前色） */
const ICONS = {
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
}

withDefaults(defineProps<{ items: NavItem[]; brand?: string }>(), {
  brand: '云岫',
})

const route = useRoute()

/** 路由项是否命中当前路径（精确或子路径前缀） */
function isActive(to: string): boolean {
  return route.path === to || route.path.startsWith(`${to}/`)
}

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

    <!-- 导航项：配置 to 渲染为 router-link 并高亮，否则为占位按钮 -->
    <nav class="sidebar__nav">
      <template v-for="item in items" :key="item.to ?? item.label">
        <RouterLink
          v-if="item.to"
          :to="item.to"
          class="sidebar__item"
          :class="{ 'is-active': isActive(item.to) }"
          :title="collapsed ? item.label : undefined"
        >
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
            <path :d="ICONS[item.icon]" />
          </svg>
          <span v-show="!collapsed" class="sidebar__label">{{ item.label }}</span>
        </RouterLink>
        <button
          v-else
          type="button"
          class="sidebar__item"
          :title="collapsed ? item.label : undefined"
        >
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
            <path :d="ICONS[item.icon]" />
          </svg>
          <span v-show="!collapsed" class="sidebar__label">{{ item.label }}</span>
        </button>
      </template>
    </nav>

    <div class="sidebar__footer">
      <button type="button" class="sidebar__cta">
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
          <path :d="ICONS.login" />
        </svg>
        <span v-show="!collapsed" class="sidebar__label">免费开始</span>
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
        <template v-for="item in items" :key="item.to ?? item.label">
          <RouterLink
            v-if="item.to"
            :to="item.to"
            class="sidebar__item"
            :class="{ 'is-active': isActive(item.to) }"
            @click="drawerOpen = false"
          >
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
              <path :d="ICONS[item.icon]" />
            </svg>
            <span class="sidebar__label">{{ item.label }}</span>
          </RouterLink>
          <button
            v-else
            type="button"
            class="sidebar__item"
            @click="drawerOpen = false"
          >
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
              <path :d="ICONS[item.icon]" />
            </svg>
            <span class="sidebar__label">{{ item.label }}</span>
          </button>
        </template>
      </nav>
      <div class="sidebar-mobile__foot">
        <button type="button" class="btn btn--primary" @click="drawerOpen = false">
          免费开始
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

/* 导航项 */
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: var(--text-base);
  text-align: left;
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
}

.sidebar.is-collapsed .sidebar__item {
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

/* 底部 CTA */
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
