<script setup lang="ts">
/** 登入/注册方式选择：作为流程第一步的整屏选择器
 *  可用项可点，未开放项置灰「暂未开放」；选中后进入对应填表步骤
 */

export interface MethodOption {
  key: string
  label: string
  desc?: string
  available?: boolean
}

defineProps<{
  methods: MethodOption[]
  title: string
  desc?: string
}>()

const emit = defineEmits<{
  select: [key: string]
}>()
</script>

<template>
  <div class="method-select">
    <header class="method-select__head">
      <h3 class="method-select__title">{{ title }}</h3>
      <p v-if="desc" class="method-select__desc text--secondary">{{ desc }}</p>
    </header>

    <div class="method-select__list" role="group" :aria-label="title">
      <button
        v-for="m in methods"
        :key="m.key"
        type="button"
        class="method"
        :class="{ 'is-disabled': !m.available }"
        :disabled="!m.available"
        :title="m.available ? undefined : '暂未开放'"
        @click="emit('select', m.key)"
      >
        <span class="method__text">
          <span class="method__label">{{ m.label }}</span>
          <span v-if="m.desc" class="method__desc">{{ m.desc }}</span>
        </span>
        <span v-if="m.available" class="method__go" aria-hidden="true">›</span>
        <span v-else class="method__hint">暂未开放</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.method-select {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.method-select__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.method-select__title {
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.08em;
}

.method-select__desc {
  font-size: var(--text-xs);
  line-height: 1.6;
}

.method-select__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.method {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-4);
  text-align: left;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
  background-color: var(--color-bg);
  color: var(--color-text);
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    background-color: var(--color-primary-soft);
  }
}

.method__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.method__label {
  font-size: var(--text-md);
}

.method__desc {
  font-size: var(--text-xs);
  color: var(--color-text-weak);
}

.method__go {
  flex-shrink: 0;
  font-size: var(--text-lg);
  color: var(--color-primary);
}

/* 暂未开放：虚框浅墨，不可点击 */
.method.is-disabled {
  border-style: dashed;
  background-color: transparent;
  color: var(--color-text-weak);
  cursor: not-allowed;
}

.method__hint {
  flex-shrink: 0;
  padding: 2px 8px;
  border: 1px dashed var(--color-border-soft);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--color-text-weak);
}

@media (prefers-reduced-motion: reduce) {
  .method {
    transition: none;
  }
}
</style>
