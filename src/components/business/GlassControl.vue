<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

/** 视觉调节齿轮：右下角悬浮，弹层内两枚滑块调节
 *  ① 毛玻璃强度 → `--glass-blur`（组件 backdrop-filter 模糊半径）
 *  ② 背景纱罩倍率 → `--veil-strength`（body 背景宣纸纱罩透明度）
 *  值写入 `<html>` 内联 CSS 变量并持久化 localStorage；已保存值在挂载时还原。
 */

const STORAGE_KEY = 'wash-glass-control'

const BLUR_MIN = 0
const BLUR_MAX = 28
const VEIL_MIN = 0
const VEIL_MAX = 1
const VEIL_STEP = 0.05

const isOpen = ref(false)
const blur = ref<number>(14)
const veil = ref<number>(1)

const rootEl = ref<HTMLElement | null>(null)

/** 滑块填充比例（用于轨道渐变高亮） */
const blurPct = computed(() =>
  `${((blur.value - BLUR_MIN) / (BLUR_MAX - BLUR_MIN)) * 100}%`,
)
const veilPct = computed(() =>
  `${((veil.value - VEIL_MIN) / (VEIL_MAX - VEIL_MIN)) * 100}%`,
)

/** 从 localStorage 恢复已保存值；脏数据忽略走默认 */
function loadPrefs(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as { blur?: unknown; veil?: unknown }
    if (typeof saved.blur === 'number' && saved.blur >= BLUR_MIN && saved.blur <= BLUR_MAX) {
      blur.value = saved.blur
    }
    if (typeof saved.veil === 'number' && saved.veil >= VEIL_MIN && saved.veil <= VEIL_MAX) {
      veil.value = saved.veil
    }
  } catch {
    // 脏数据忽略，走默认
  }
}

/** 写入 CSS 变量 + 持久化 */
function applyVars(): void {
  const root = document.documentElement
  root.style.setProperty('--glass-blur', `${blur.value}px`)
  root.style.setProperty('--veil-strength', String(veil.value))
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ blur: blur.value, veil: veil.value }),
  )
}

function handleBlur(event: Event): void {
  blur.value = Number((event.target as HTMLInputElement).value)
  applyVars()
}

function handleVeil(event: Event): void {
  veil.value = Number((event.target as HTMLInputElement).value)
  applyVars()
}

function togglePanel(): void {
  isOpen.value = !isOpen.value
}

/** 点击面板外区域收起 */
function handleOutside(event: MouseEvent): void {
  if (!isOpen.value) return
  if (rootEl.value && !rootEl.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  loadPrefs()
  applyVars() // 无保存值时写默认，保证 CSS 变量与主题一致
  window.addEventListener('click', handleOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleOutside)
})
</script>

<template>
  <div ref="rootEl" class="glass-control">
    <button
      type="button"
      class="glass-control__trigger"
      :aria-expanded="isOpen"
      :aria-label="isOpen ? '收起视觉调节' : '调节毛玻璃与背景纱罩'"
      @click="togglePanel"
    >
      <svg
        class="glass-control__gear"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3" />
        <path
          d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        />
      </svg>
    </button>

    <transition name="glass-pop">
      <div v-if="isOpen" class="glass-control__panel" role="group" aria-label="视觉调节">
        <label class="glass-control__row">
          <span class="glass-control__label">毛玻璃</span>
          <input
            type="range"
            class="glass-control__range"
            :min="BLUR_MIN"
            :max="BLUR_MAX"
            step="1"
            :value="blur"
            :style="{ '--fill': blurPct }"
            @input="handleBlur"
          />
          <span class="glass-control__value">{{ blur }}px</span>
        </label>
        <label class="glass-control__row">
          <span class="glass-control__label">纱罩</span>
          <input
            type="range"
            class="glass-control__range"
            :min="VEIL_MIN"
            :max="VEIL_MAX"
            :step="VEIL_STEP"
            :value="veil"
            :style="{ '--fill': veilPct }"
            @input="handleVeil"
          />
          <span class="glass-control__value">{{ Math.round(veil * 100) }}%</span>
        </label>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* 悬浮右下角：容器不拦截点击，仅齿轮与弹层可交互；
   column-reverse 使弹层在齿轮上方，点击向上展开 */
.glass-control {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: 50;
  display: flex;
  flex-direction: column-reverse;
  align-items: flex-end;
  gap: var(--space-2);
  pointer-events: none;
}

.glass-control__trigger {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-soft);
  background-color: color-mix(in srgb, var(--color-bg) 62%, transparent);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  box-shadow: var(--shadow-soft);
  color: var(--color-text-secondary);
  transition:
    color 0.2s ease,
    transform 0.3s ease;

  &:hover {
    color: var(--color-ink);
  }
}

.glass-control__trigger[aria-expanded='true'] {
  color: var(--color-ink);
  transform: rotate(45deg);
}

.glass-control__gear {
  width: 22px;
  height: 22px;
  transition: transform 0.3s ease;
}

.glass-control__trigger[aria-expanded='true'] .glass-control__gear {
  transform: rotate(90deg);
}

/* 弹层：毛玻璃小卡 */
.glass-control__panel {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 220px;
  padding: var(--space-4);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background-color: color-mix(in srgb, var(--color-bg) 72%, transparent);
  backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(140%);
  box-shadow: var(--shadow-soft);
}

.glass-control__row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.glass-control__label {
  width: 44px;
  flex-shrink: 0;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.glass-control__value {
  width: 44px;
  flex-shrink: 0;
  text-align: right;
  font-size: var(--text-xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-weak);
}

/* 自定义滑块轨道：填充段墨色高亮，起点淡化 */
.glass-control__range {
  appearance: none;
  -webkit-appearance: none;
  flex: 1;
  min-width: 0;
  height: 4px;
  border-radius: var(--radius-full);
  background: linear-gradient(
    to right,
    var(--color-primary) 0%,
    var(--color-primary) var(--fill),
    var(--color-primary-soft) var(--fill),
    var(--color-primary-soft) 100%
  );
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: var(--radius-full);
    border: 2px solid var(--color-bg);
    background-color: var(--color-accent);
    box-shadow: var(--shadow-soft);
  }

  &::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: var(--radius-full);
    border: 2px solid var(--color-bg);
    background-color: var(--color-accent);
    box-shadow: var(--shadow-soft);
  }
}

/* 弹层出现过渡 */
.glass-pop-enter-active,
.glass-pop-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.25s ease;
}

.glass-pop-enter-from,
.glass-pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

/* 尊重系统减动效偏好 */
@media (prefers-reduced-motion: reduce) {
  .glass-control__trigger,
  .glass-control__gear,
  .glass-pop-enter-active,
  .glass-pop-leave-active {
    transition: none;
  }
}
</style>
