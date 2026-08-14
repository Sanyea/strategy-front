<script setup lang="ts">
/** 登入/注册 模式开关：单卡内切换，一次只展示一张表单 */

const props = defineProps<{ modelValue: 'login' | 'register' }>()

const emit = defineEmits<{
  'update:modelValue': [mode: 'login' | 'register']
}>()

const modes = [
  { key: 'login', label: '登入' },
  { key: 'register', label: '注册' },
] as const
</script>

<template>
  <div class="mode-switch" role="tablist" aria-label="切换登入或注册">
    <button
      v-for="m in modes"
      :key="m.key"
      type="button"
      class="mode-switch__item"
      :class="{ 'is-active': modelValue === m.key }"
      role="tab"
      :aria-selected="modelValue === m.key"
      @click="emit('update:modelValue', m.key)"
    >
      {{ m.label }}
    </button>
  </div>
</template>

<style scoped>
.mode-switch {
  display: flex;
  justify-content: center;
  gap: var(--space-6);
  padding-block: var(--space-2);
}

.mode-switch__item {
  position: relative;
  padding: 4px 2px 6px;
  font-family: var(--font-display);
  font-size: var(--text-lg);
  letter-spacing: 0.14em;
  color: var(--color-text-weak);
  transition: color 0.2s ease;

  &:hover {
    color: var(--color-text-secondary);
  }

  &.is-active {
    color: var(--color-ink);
  }

  /* 当前项：墨色下划线 */
  &.is-active::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 2px;
    background-color: var(--color-primary);
  }
}

@media (prefers-reduced-motion: reduce) {
  .mode-switch__item {
    transition: none;
  }
}
</style>
