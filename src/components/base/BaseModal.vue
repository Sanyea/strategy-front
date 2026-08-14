<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

/** 水墨弹窗：遮罩 + 面板 + 标题 + 内容 + 底部操作区；Esc / 点击遮罩关闭 */

const props = defineProps<{
  open: boolean
  title: string
  width?: string
}>()

const emit = defineEmits<{
  close: []
}>()

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal" role="dialog" aria-modal="true" :aria-label="title">
        <div class="modal__scrim" @click="emit('close')" />
        <div class="modal__panel" :style="{ maxWidth: width ?? '520px' }">
          <header class="modal__head">
            <h3 class="modal__title">{{ title }}</h3>
            <button type="button" class="modal__close" aria-label="关闭" @click="emit('close')">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>
          <div class="modal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="modal__foot">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: var(--space-4);
}

.modal__scrim {
  position: absolute;
  inset: 0;
  background-color: color-mix(in srgb, var(--color-ink) 30%, transparent);
  backdrop-filter: blur(2px);
}

.modal__panel {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  max-height: min(86vh, 760px);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  background-color: var(--color-bg);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border-soft);
}

.modal__title {
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.06em;
}

.modal__close {
  display: flex;
  padding: 4px;
  border-radius: var(--radius-sm);
  color: var(--color-text-weak);

  & svg {
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: var(--color-ink);
  }
}

.modal__body {
  padding: var(--space-5);
  overflow-y: auto;
}

.modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border-soft);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.22s ease;

  .modal__panel {
    transition: transform 0.22s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal__panel {
    transform: translateY(8px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal__panel,
  .modal-leave-active .modal__panel {
    transition: none;
  }
}
</style>
