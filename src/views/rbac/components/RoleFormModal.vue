<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { create, update } from '@/api/modules/rbac/rbacRole'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/base/BaseModal.vue'

/** 角色新建/编辑弹窗；role 为空即新建，编辑时 roleCode 禁改（后端内置角色禁改） */

const props = defineProps<{
  open: boolean
  role?: API.RoleVO | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { success } = useToast()

const form = reactive({
  roleCode: '',
  roleName: '',
  dataScope: 1,
  sortOrder: 0,
  remark: '',
})

const loading = ref(false)
const formError = ref('')

watch(
  () => [props.open, props.role] as const,
  ([open, role]) => {
    if (!open) return
    formError.value = ''
    form.roleCode = role?.roleCode ?? ''
    form.roleName = role?.roleName ?? ''
    form.dataScope = scopeToNumber(role?.dataScope)
    form.sortOrder = role?.sortOrder ?? 0
    form.remark = role?.remark ?? ''
  },
)

function scopeToNumber(scope?: API.RoleVO['dataScope']): number {
  const map: Record<string, number> = { ALL: 1, SELF: 2, DEPT: 3, DEPT_AND_BELOW: 4, CUSTOM: 5 }
  return scope ? map[scope] ?? 1 : 1
}

async function handleSave(): Promise<void> {
  formError.value = ''
  if (!form.roleCode.trim()) {
    formError.value = '请填写角色编码'
    return
  }
  if (!form.roleName.trim()) {
    formError.value = '请填写角色名称'
    return
  }

  const body: API.RoleDTO = {
    roleCode: form.roleCode.trim(),
    roleName: form.roleName.trim(),
    dataScope: form.dataScope,
    sortOrder: form.sortOrder,
    remark: form.remark.trim() || undefined,
  }

  loading.value = true
  try {
    if (props.role?.id) {
      await update({ id: props.role.id }, body)
    } else {
      await create(body)
    }
    success(props.role?.id ? '角色已更新' : '角色已创建')
    emit('saved')
  } catch (err) {
    formError.value = readApiErrorMessage(err, '保存失败，请稍后再试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" :title="role?.id ? '编辑角色' : '新建角色'" @close="emit('close')">
    <form class="role-form" novalidate @submit.prevent="handleSave">
      <div class="field">
        <label class="field__label" for="role-code">角色编码</label>
        <input
          id="role-code"
          v-model="form.roleCode"
          class="input"
          type="text"
          placeholder="如 SUPER_ADMIN"
          :disabled="!!role?.id"
          spellcheck="false"
        />
        <p v-if="role?.id" class="field__hint">编辑时角色编码不可修改</p>
      </div>

      <div class="field">
        <label class="field__label" for="role-name">角色名称</label>
        <input
          id="role-name"
          v-model="form.roleName"
          class="input"
          type="text"
          placeholder="如 超级管理员"
          spellcheck="false"
        />
      </div>

      <div class="field">
        <label class="field__label" for="role-scope">数据权限范围</label>
        <select id="role-scope" v-model.number="form.dataScope" class="select">
          <option :value="1">全部</option>
          <option :value="2">仅本人</option>
          <option :value="3">本部门</option>
          <option :value="4">本部门及以下</option>
          <option :value="5">自定义</option>
        </select>
      </div>

      <div class="field">
        <label class="field__label" for="role-sort">显示顺序</label>
        <input id="role-sort" v-model.number="form.sortOrder" class="input" type="number" />
      </div>

      <div class="field">
        <label class="field__label" for="role-remark">备注</label>
        <textarea id="role-remark" v-model="form.remark" class="input" rows="3" />
      </div>

      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
    </form>

    <template #footer>
      <button type="button" class="btn btn--ghost" :disabled="loading" @click="emit('close')">
        取消
      </button>
      <button type="button" class="btn btn--primary" :disabled="loading" @click="handleSave">
        {{ loading ? '保存中…' : '保存' }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.role-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.field__hint {
  font-size: var(--text-xs);
  color: var(--color-text-weak);
}

input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.form-error {
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-danger-soft);
  border-radius: var(--radius-sm);
  background-color: var(--color-danger-soft);
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
