<script lang="ts">
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
</script>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRoute } from 'vue-router'

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
