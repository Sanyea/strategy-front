<script setup lang="ts">
import { computed } from 'vue'

/** 水墨分页条：页码 + 总数；change 事件携带目标页码 */

const props = defineProps<{
  current: number
  size: number
  total: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const pages = computed(() => Math.max(1, Math.ceil(props.total / props.size)))

/** 窗口化页码：最多展示 7 个，当前页居中 */
const window = computed<number[]>(() => {
  const count = Math.min(pages.value, 7)
  let start = props.current - Math.floor(count / 2)
  start = Math.max(1, Math.min(start, pages.value - count + 1))
  return Array.from({ length: count }, (_, i) => start + i)
})

function go(page: number): void {
  if (page < 1 || page > pages.value || page === props.current) return
  emit('change', page)
}
</script>

<template>
  <nav v-if="total > 0" class="pager" aria-label="分页">
    <span class="pager__info text--weak">共 {{ total }} 条</span>
    <div class="pager__controls">
      <button
        type="button"
        class="pager__btn"
        :disabled="current <= 1"
        aria-label="上一页"
        @click="go(current - 1)"
      >
        ‹
      </button>
      <button
        v-for="p in window"
        :key="p"
        type="button"
        class="pager__btn"
        :class="{ 'is-active': p === current }"
        :aria-current="p === current ? 'page' : undefined"
        @click="go(p)"
      >
        {{ p }}
      </button>
      <button
        type="button"
        class="pager__btn"
        :disabled="current >= pages"
        aria-label="下一页"
        @click="go(current + 1)"
      >
        ›
      </button>
    </div>
  </nav>
</template>

<style scoped>
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-4);
  font-size: var(--text-sm);
}

.pager__controls {
  display: flex;
  gap: var(--space-1);
}

.pager__btn {
  min-width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xs);
  background-color: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;

  &:hover:not(:disabled):not(.is-active) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &.is-active {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
    color: var(--color-on-primary);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pager__btn {
    transition: none;
  }
}
</style>
