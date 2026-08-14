<script setup lang="ts">
import { computed } from 'vue'
import { statusMeta } from '../meta'

/** 状态小章：启用 = 墨实章 / 停用 = 虚框，禁用态弱显 */

const props = defineProps<{
  status?: string | number | null
  disabled?: boolean
}>()

const meta = computed(() => statusMeta(props.status))
</script>

<template>
  <span class="status-tag" :class="[meta.ok ? 'is-ok' : 'is-off', { 'is-muted': disabled }]">
    {{ meta.text }}
  </span>
</template>

<style scoped>
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
  font-size: var(--text-xs);
  line-height: 1.6;
}

.is-ok {
  background-color: var(--color-primary-soft);
  color: var(--color-primary);
}

.is-off {
  border: 1px dashed var(--color-border);
  color: var(--color-text-weak);
}

.is-muted {
  opacity: 0.6;
}
</style>
