<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { create1, update1 } from '@/api/modules/rbac/rbacPermission'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/base/BaseModal.vue'

/** 权限新建/编辑弹窗；permission 为空即新建（新建时指定 parent），编辑时 permissionCode 禁改 */

const props = defineProps<{
  open: boolean
  permission?: API.PermissionVO | null
  parentName?: string
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { success } = useToast()

const PERMISSION_TYPES = [
  { value: 'DIRECTORY', label: '目录' },
  { value: 'MENU', label: '菜单' },
  { value: 'BUTTON', label: '按钮' },
  { value: 'INTERFACE', label: '接口' },
] as const

const form = reactive({
  parentId: 0,
  permissionName: '',
  permissionType: 'MENU' as API.PermissionDTO['permissionType'],
  permissionCode: '',
  routePath: '',
  componentPath: '',
  apiMethod: 'GET',
  apiPath: '',
  icon: '',
  sortOrder: 0,
  isVisible: 'YES' as API.PermissionDTO['isVisible'],
  remark: '',
})

const loading = ref(false)
const formError = ref('')

watch(
  () => [props.open, props.permission, props.parentName] as const,
  ([open, permission]) => {
    if (!open) return
    formError.value = ''
    form.parentId = permission?.parentId ?? 0
    form.permissionName = permission?.permissionName ?? ''
    form.permissionType = permission?.permissionType ?? 'MENU'
    form.permissionCode = permission?.permissionCode ?? ''
    form.routePath = permission?.routePath ?? ''
    form.componentPath = permission?.componentPath ?? ''
    form.apiMethod = permission?.apiMethod ?? 'GET'
    form.apiPath = permission?.apiPath ?? ''
    form.icon = permission?.icon ?? ''
    form.sortOrder = permission?.sortOrder ?? 0
    form.isVisible = permission?.isVisible ?? 'YES'
    form.remark = permission?.remark ?? ''
  },
)

async function handleSave(): Promise<void> {
  formError.value = ''
  if (!form.permissionName.trim()) {
    formError.value = '请填写资源名称'
    return
  }

  const body: API.PermissionDTO = {
    parentId: form.parentId,
    permissionName: form.permissionName.trim(),
    permissionType: form.permissionType,
    permissionCode: form.permissionCode.trim() || undefined,
    routePath: form.routePath.trim() || undefined,
    componentPath: form.componentPath.trim() || undefined,
    apiMethod: form.apiMethod.trim() || undefined,
    apiPath: form.apiPath.trim() || undefined,
    icon: form.icon.trim() || undefined,
    sortOrder: form.sortOrder,
    isVisible: form.isVisible,
    remark: form.remark.trim() || undefined,
  }

  loading.value = true
  try {
    if (props.permission?.id) {
      await update1({ id: props.permission.id }, body)
    } else {
      await create1(body)
    }
    success(props.permission?.id ? '权限已更新' : '权限已创建')
    emit('saved')
  } catch (err) {
    formError.value = readApiErrorMessage(err, '保存失败，请稍后再试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" :title="permission?.id ? '编辑权限' : '新建权限'" width="560px" @close="emit('close')">
    <form class="perm-form" novalidate @submit.prevent="handleSave">
      <div class="perm-form__grid">
        <div class="field">
          <label class="field__label" for="perm-name">资源名称</label>
          <input
            id="perm-name"
            v-model="form.permissionName"
            class="input"
            type="text"
            placeholder="如 用户管理"
            spellcheck="false"
          />
        </div>

        <div class="field">
          <label class="field__label" for="perm-type">资源类型</label>
          <select id="perm-type" v-model="form.permissionType" class="select">
            <option v-for="t in PERMISSION_TYPES" :key="t.value" :value="t.value">
              {{ t.label }}
            </option>
          </select>
        </div>

        <div class="field">
          <label class="field__label" for="perm-parent">父级</label>
          <input id="perm-parent" class="input" type="text" :value="parentName || '根'" disabled />
        </div>

        <div class="field">
          <label class="field__label" for="perm-sort">显示顺序</label>
          <input id="perm-sort" v-model.number="form.sortOrder" class="input" type="number" />
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="perm-code">权限标识</label>
        <input
          id="perm-code"
          v-model="form.permissionCode"
          class="input"
          type="text"
          placeholder="如 system:user:create（按钮/接口用）"
          :disabled="!!permission?.id"
          spellcheck="false"
        />
        <p v-if="permission?.id" class="field__hint">编辑时权限标识不可修改</p>
      </div>

      <div v-if="form.permissionType === 'DIRECTORY' || form.permissionType === 'MENU'" class="perm-form__grid">
        <div class="field">
          <label class="field__label" for="perm-route">路由路径</label>
          <input id="perm-route" v-model="form.routePath" class="input" type="text" placeholder="/system/user" />
        </div>
        <div class="field">
          <label class="field__label" for="perm-component">组件路径</label>
          <input id="perm-component" v-model="form.componentPath" class="input" type="text" placeholder="system/user/index" />
        </div>
      </div>

      <div v-if="form.permissionType === 'INTERFACE'" class="perm-form__grid">
        <div class="field">
          <label class="field__label" for="perm-method">请求方法</label>
          <select id="perm-method" v-model="form.apiMethod" class="select">
            <option v-for="m in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <div class="field">
          <label class="field__label" for="perm-api">接口路径</label>
          <input id="perm-api" v-model="form.apiPath" class="input" type="text" placeholder="/api/system/user" spellcheck="false" />
        </div>
      </div>

      <div v-if="form.permissionType === 'DIRECTORY' || form.permissionType === 'MENU'" class="perm-form__grid">
        <div class="field">
          <label class="field__label" for="perm-icon">图标</label>
          <input id="perm-icon" v-model="form.icon" class="input" type="text" placeholder="如 role" spellcheck="false" />
        </div>
        <div class="field">
          <label class="field__label" for="perm-visible">是否显示</label>
          <select id="perm-visible" v-model="form.isVisible" class="select">
            <option value="YES">显示</option>
            <option value="NO">隐藏</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="perm-remark">备注</label>
        <textarea id="perm-remark" v-model="form.remark" class="input" rows="2" />
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
.perm-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.perm-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 480px) {
  .perm-form__grid {
    grid-template-columns: 1fr;
  }
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
