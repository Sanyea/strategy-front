<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMenuStore } from '@/stores/modules/menu'
import type { MenuNode } from '@/stores/modules/menu'

/** 顶部面包屑：优先按菜单树构建层级链（父级可点击回跳其页面）；
 *  菜单树未加载或未命中时回落路由嵌套层级。不含首页根，回首页仅走登出 */

interface Crumb {
  label: string
  to?: string
}

const route = useRoute()
const menuStore = useMenuStore()

/** 在菜单树中查找当前路由对应节点，返回根到该节点的祖先链；未命中返回 null */
function findMenuChain(
  nodes: MenuNode[] | null,
  target: string,
  trail: MenuNode[] = [],
): MenuNode[] | null {
  if (!nodes) return null
  for (const node of nodes) {
    const next = [...trail, node]
    if (node.routePath === target) return next
    if (node.children) {
      const found = findMenuChain(node.children, target, next)
      if (found) return found
    }
  }
  return null
}

/** 由菜单树祖先链生成面包屑：父级带 routePath 则渲染为可点击链接 */
function crumbsFromTree(): Crumb[] {
  const chain = findMenuChain(menuStore.tree, route.path)
  if (!chain) return []
  const crumbs: Crumb[] = []
  let prev = ''
  for (const node of chain) {
    const label = node.permissionName
    if (!label || label === prev) continue
    if (node.routePath === '/') continue
    prev = label
    const isCurrent = node.routePath === route.path
    crumbs.push({
      label,
      to: !isCurrent && node.routePath ? node.routePath : undefined,
    })
  }
  return crumbs
}

/** 回落：按路由嵌套层级生成面包屑（菜单树未加载或未命中时） */
function crumbsFromRoute(): Crumb[] {
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
}

const crumbs = computed<Crumb[]>(() => {
  const fromTree = crumbsFromTree()
  return fromTree.length ? fromTree : crumbsFromRoute()
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
