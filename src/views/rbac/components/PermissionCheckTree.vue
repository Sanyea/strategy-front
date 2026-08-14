<script setup lang="ts">
/** 权限勾选树：递归渲染，父级选中联动子级，半选状态；checked 为全局 ID 数组 */
import { PERMISSION_TYPE_LABEL } from '../meta'

const props = defineProps<{
  nodes: API.PermissionVO[]
  checked: number[]
}>()

const emit = defineEmits<{
  'update:checked': [ids: number[]]
}>()

/** 收集节点自身 + 全部后代 ID */
function collectIds(node: API.PermissionVO): number[] {
  const ids = node.id ? [node.id] : []
  if (node.children?.length) {
    for (const child of node.children) ids.push(...collectIds(child))
  }
  return ids
}

function nodeState(node: API.PermissionVO): { checked: boolean; indeterminate: boolean } {
  const ids = collectIds(node)
  const hit = ids.filter((id) => props.checked.includes(id)).length
  return {
    checked: ids.length > 0 && hit === ids.length,
    indeterminate: hit > 0 && hit < ids.length,
  }
}

function toggle(node: API.PermissionVO): void {
  const ids = collectIds(node)
  const { checked } = nodeState(node)
  emit(
    'update:checked',
    checked
      ? props.checked.filter((id) => !ids.includes(id))
      : [...new Set([...props.checked, ...ids])],
  )
}
</script>

<template>
  <ul class="ptree">
    <li v-for="node in nodes" :key="node.id">
      <div class="ptree__row">
        <label class="ptree__check">
          <input
            type="checkbox"
            :checked="nodeState(node).checked"
            :indeterminate.prop="nodeState(node).indeterminate"
            @change="toggle(node)"
          />
          <span class="ptree__name">{{ node.permissionName }}</span>
        </label>
        <span class="ptree__type">{{ PERMISSION_TYPE_LABEL[node.permissionType ?? ''] ?? node.permissionType }}</span>
        <span v-if="node.permissionCode" class="ptree__code">{{ node.permissionCode }}</span>
      </div>
      <PermissionCheckTree
        v-if="node.children?.length"
        :nodes="node.children"
        :checked="checked"
        @update:checked="emit('update:checked', $event)"
      />
    </li>
  </ul>
</template>

<style scoped>
.ptree {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.ptree__row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 6px 10px;
  border-radius: var(--radius-sm);
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--color-primary-soft);
  }
}

.ptree__check {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  cursor: pointer;

  input {
    accent-color: var(--color-primary);
  }
}

.ptree__name {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.ptree__type {
  flex-shrink: 0;
  padding: 1px 6px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-xs);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.ptree__code {
  margin-left: auto;
  flex-shrink: 0;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-text-weak);
}

.ptree__children {
  margin-left: 18px;
  padding-left: var(--space-3);
  border-left: 1px solid var(--color-border-soft);
}

@media (prefers-reduced-motion: reduce) {
  .ptree__row {
    transition: none;
  }
}
</style>
