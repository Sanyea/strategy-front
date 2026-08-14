<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

/** 顶部面包屑：路由嵌套层级展示，末级为当前页；中间级可点击回跳（不含首页根，回首页仅走登出） */

interface Crumb {
  label: string
  to?: string
}

const route = useRoute()

const crumbs = computed<Crumb[]>(() => {
  const trail: Crumb[] = []
  let prev = ''
  for (const record of route.matched) {
    const label = record.meta?.title as string | undefined
    if (!label || label === prev) continue
    prev = label
    trail.push({
      label,
      // 当前路径所在级不可点，其余可回跳
      to: record.path && record.path !== route.path ? record.path : undefined,
    })
  }
  return trail
})
</script>

<template>
  <nav v-if="crumbs.length" class="crumbs" aria-label="面包屑">
    <template v-for="(crumb, i) in crumbs" :key="i">
      <RouterLink v-if="crumb.to" class="crumbs__link" :to="crumb.to">
        {{ crumb.label }}
      </RouterLink>
      <span v-else class="crumbs__current">{{ crumb.label }}</span>
      <span v-if="i < crumbs.length - 1" class="crumbs__sep" aria-hidden="true">/</span>
    </template>
  </nav>
</template>

<style scoped>
.crumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.crumbs__link {
  color: var(--color-text-secondary);
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-primary);
  }
}

.crumbs__current {
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.08em;
  color: var(--color-ink);
}

.crumbs__sep {
  color: var(--color-text-weak);
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .crumbs__link {
    transition: none;
  }
}
</style>
