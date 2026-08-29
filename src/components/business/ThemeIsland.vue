<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/** 水墨四色系主题切换「灵动岛」悬浮组件
 *  悬浮吸顶 + 毛玻璃；滚动后自动收缩为半透明胶囊；鼠标移入 / 键盘聚焦时展开。
 *  主题写入 <html data-theme>，并持久化到 localStorage。
 */

interface ThemeOption {
  key: string
  name: string
  desc: string
}

const THEME_KEY = 'ink-theme'
const SCROLL_THRESHOLD = 80

const themes: ThemeOption[] = [
  { key: 'mono', name: '墨韵', desc: '经典墨韵黑白' },
  { key: 'mist', name: '烟雨', desc: '青灰烟雨' },
  { key: 'tea', name: '茶褐', desc: '茶褐古雅' },
  { key: 'wash', name: '淡彩', desc: '淡彩水墨' },
]

const activeTheme = ref<string>(localStorage.getItem(THEME_KEY) ?? 'mono')
const isScrolled = ref(false)
const isHovered = ref(false)

/** 展开条件：未滚动（页顶）或鼠标移入 / 键盘聚焦 */
const isExpanded = computed(() => !isScrolled.value || isHovered.value)

const currentTheme = computed(
  () => themes.find((t) => t.key === activeTheme.value) ?? themes[0],
)

function handleThemeChange(key: string): void {
  activeTheme.value = key
  document.documentElement.dataset.theme = key
  localStorage.setItem(THEME_KEY, key)
}

function handleScroll(): void {
  isScrolled.value = window.scrollY > SCROLL_THRESHOLD
}

onMounted(() => {
  document.documentElement.dataset.theme = activeTheme.value
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="theme-island">
    <div
      class="theme-island__pill"
      :class="{ 'is-expanded': isExpanded }"
      role="group"
      aria-label="切换水墨色系"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      @focusin="isHovered = true"
      @focusout="isHovered = false"
    >
      <!-- 收缩态：当前主题名 + 墨点 -->
      <span class="theme-island__collapsed" aria-hidden="true">
        <span class="theme-island__dot" />
        <span>{{ currentTheme?.name }}</span>
      </span>

      <!-- 展开态：四色系切换 -->
      <span class="theme-island__items">
        <span class="theme-island__items-inner">
          <button
            v-for="theme in themes"
            :key="theme.key"
            type="button"
            class="theme-island__item"
            :class="{ 'is-active': activeTheme === theme.key }"
            :aria-pressed="activeTheme === theme.key"
            :title="theme.desc"
            @click="handleThemeChange(theme.key)"
          >
            {{ theme.name }}
          </button>
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 悬浮吸顶：固定于顶部中央，容器不拦截点击，仅胶囊本体可交互 */
.theme-island {
  position: fixed;
  top: var(--space-3);
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  pointer-events: none;
}

.theme-island__pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-soft);
  /* 毛玻璃：半透明底色 + 背景模糊 */
  background-color: color-mix(in srgb, var(--color-bg) 62%, transparent);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  box-shadow: var(--shadow-soft);
  pointer-events: auto;
  transition:
    background-color 0.35s ease,
    box-shadow 0.35s ease;
}

/* 收缩态：半透明胶囊 */
.theme-island__pill:not(.is-expanded) {
  background-color: color-mix(in srgb, var(--color-bg) 42%, transparent);
  box-shadow: none;
}

/* 收缩态标签 */
.theme-island__collapsed {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-ink);
  white-space: nowrap;
  transition:
    opacity 0.25s ease,
    width 0.35s ease;
}

.theme-island__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background-color: var(--color-accent);
  opacity: 0.85;
}

.theme-island__pill.is-expanded .theme-island__collapsed {
  opacity: 0;
  width: 0;
  overflow: hidden;
  margin: 0;
}

/* 展开项：宽度平滑展开 */
.theme-island__items {
  display: inline-flex;
  overflow: hidden;
  max-width: 0;
  opacity: 0;
  visibility: hidden;
  transition:
    max-width 0.35s ease,
    opacity 0.25s ease,
    visibility 0s linear 0.35s;
}

.theme-island__pill.is-expanded .theme-island__items {
  max-width: 360px;
  opacity: 1;
  visibility: visible;
  transition-delay: 0s;
}

.theme-island__items-inner {
  display: inline-flex;
  gap: var(--space-1);
  white-space: nowrap;
}

.theme-island__item {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
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

/* 尊重系统减动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .theme-island__pill,
  .theme-island__collapsed,
  .theme-island__items,
  .theme-island__item {
    transition: none;
  }
}
</style>
