<script setup lang="ts">
/** 权限树表格：递归渲染 <tr> 行（缩进 + 类型 + 状态 + 操作），操作事件上抛 */
import StatusTag from './StatusTag.vue'
import { PERMISSION_TYPE_LABEL, formatTime } from '../meta'

const props = withDefaults(
  defineProps<{
    nodes: API.PermissionVO[]
    depth?: number
  }>(),
  { depth: 0 },
)

const emit = defineEmits<{
  add: [node: API.PermissionVO]
  edit: [node: API.PermissionVO]
  del: [node: API.PermissionVO]
  toggle: [node: API.PermissionVO]
}>()

const indent = (d: number): string => `${d * 22 + 8}px`
</script>

<template>
  <template v-for="node in nodes" :key="node.id">
    <tr>
      <td>
        <span class="perm-name" :style="{ paddingLeft: indent(depth) }">
          <span class="perm-name__caret" aria-hidden="true">{{ node.children?.length ? '❖' : '·' }}</span>
          {{ node.permissionName }}
        </span>
      </td>
      <td>
        <span class="tag">{{ PERMISSION_TYPE_LABEL[node.permissionType ?? ''] ?? node.permissionType }}</span>
      </td>
      <td class="perm-code">{{ node.permissionCode || '—' }}</td>
      <td><StatusTag :status="node.status" :disabled="node.isBuiltIn === 'YES'" /></td>
      <td class="perm-time">{{ formatTime(node.createTime) }}</td>
      <td class="table__ops">
        <div class="row-ops">
          <button type="button" class="row-op" @click="emit('add', node)">新增子级</button>
          <button type="button" class="row-op" @click="emit('edit', node)">编辑</button>
          <button type="button" class="row-op" @click="emit('toggle', node)">
            {{ node.status === 'NORMAL' ? '停用' : '启用' }}
          </button>
          <button type="button" class="row-op row-op--danger" @click="emit('del', node)">删除</button>
        </div>
      </td>
    </tr>
    <PermissionTreeTable
      v-if="node.children?.length"
      :nodes="node.children"
      :depth="depth + 1"
      @add="emit('add', $event)"
      @edit="emit('edit', $event)"
      @del="emit('del', $event)"
      @toggle="emit('toggle', $event)"
    />
  </template>
</template>

<style scoped>
.perm-name {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
}

.perm-name__caret {
  color: var(--color-accent);
  font-size: var(--text-xs);
  opacity: 0.8;
}

.perm-code {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.perm-time {
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
</style>
