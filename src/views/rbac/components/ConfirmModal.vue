<script setup lang="ts">
import BaseModal from '@/components/base/BaseModal.vue'

/** 确认弹窗：危险操作用 danger 强调，确定后触发 confirm */

defineProps<{
  open: boolean
  title: string
  message: string
  danger?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <BaseModal :open="open" :title="title" width="400px" @close="emit('close')">
    <p class="confirm-msg">{{ message }}</p>

    <template #footer>
      <button type="button" class="btn btn--ghost" @click="emit('close')">取消</button>
      <button
        type="button"
        class="btn"
        :class="danger ? 'btn--danger' : 'btn--primary'"
        @click="emit('confirm')"
      >
        确定
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-msg {
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.7;
}
</style>
