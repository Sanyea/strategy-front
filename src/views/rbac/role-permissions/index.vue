<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { page as pageRoles } from '@/api/modules/rbac/rbacRole'
import { tree as treePermissions } from '@/api/modules/rbac/rbacPermission'
import { permissions, replace1 } from '@/api/modules/rbac/rbacRolePermission'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import PermissionCheckTree from '../components/PermissionCheckTree.vue'

/** 角色授权：选角色 → 勾选权限树 → 覆盖保存（replace1 全量替换） */

const route = useRoute()
const { success, error } = useToast()

const roles = ref<API.RoleVO[]>([])
const roleId = ref<number | null>(null)

const tree = ref<API.PermissionVO[]>([])
const checked = ref<number[]>([])
const loadingRole = ref(false)
const saving = ref(false)

async function loadRoles(): Promise<void> {
  try {
    const res = await pageRoles({ query: { size: 100 } })
    roles.value = res.data?.records ?? []
    // 路由带 roleId（角色页「授权」入口）则自动选中
    const q = route.query.roleId as string | undefined
    if (q && /^\d+$/.test(q)) {
      roleId.value = Number(q)
    } else if (roles.value.length && roleId.value == null) {
      roleId.value = roles.value[0].id ?? null
    }
  } catch (err) {
    error(readApiErrorMessage(err, '角色列表加载失败'))
  }
}

async function loadAuthorization(id: number): Promise<void> {
  loadingRole.value = true
  try {
    const [treeRes, permRes] = await Promise.all([
      treePermissions({ query: {} }),
      permissions({ id }),
    ])
    tree.value = treeRes.data ?? []
    checked.value = (permRes.data ?? []).map((p) => p.id).filter((x): x is number => x != null)
  } catch (err) {
    error(readApiErrorMessage(err, '权限数据加载失败'))
  } finally {
    loadingRole.value = false
  }
}

watch(roleId, (id) => {
  if (id != null) void loadAuthorization(id)
})

const selectedRole = () => roles.value.find((r) => r.id === roleId.value)

async function save(): Promise<void> {
  if (roleId.value == null) return
  saving.value = true
  try {
    await replace1({ id: roleId.value }, { permissionIds: checked.value })
    success('角色权限已更新')
  } catch (err) {
    error(readApiErrorMessage(err, '保存失败'))
  } finally {
    saving.value = false
  }
}

onMounted(() => loadRoles())
</script>

<template>
  <div class="auth-page">
    <div class="card auth-bar">
      <div class="auth-bar__pick">
        <label class="auth-bar__label" for="role-pick">授权角色</label>
        <select id="role-pick" v-model="roleId" class="select auth-bar__select">
          <option :value="null" disabled>请选择角色</option>
          <option v-for="r in roles" :key="r.id" :value="r.id">
            {{ r.roleName ?? r.roleCode }}（{{ r.roleCode }}）
          </option>
        </select>
      </div>
      <p class="auth-bar__tip text--weak">
        已勾选 {{ checked.length }} 项；保存将全量覆盖该角色权限，变更自动踢该角色下用户重登。
      </p>
    </div>

    <div class="card auth-tree">
      <div v-if="loadingRole" class="auth-tree__empty">载入中…</div>
      <div v-else-if="!tree.length" class="auth-tree__empty">暂无权限资源</div>
      <div v-else class="auth-tree__body">
        <PermissionCheckTree v-model:checked="checked" :nodes="tree" />
      </div>

      <footer class="auth-tree__foot">
        <button
          type="button"
          class="btn btn--primary"
          :disabled="saving || roleId == null || loadingRole"
          @click="save"
        >
          {{ saving ? '保存中…' : '保存授权' }}
        </button>
        <span class="auth-tree__role text--weak">
          当前角色：{{ selectedRole()?.roleName ?? selectedRole()?.roleCode ?? '未选择' }}
        </span>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-4);
}

.auth-bar__pick {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.auth-bar__label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.auth-bar__select {
  width: 260px;
}

.auth-bar__tip {
  font-size: var(--text-xs);
}

.auth-tree {
  padding: var(--space-4);
}

.auth-tree__empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-weak);
  font-size: var(--text-sm);
}

.auth-tree__body {
  max-height: 60vh;
  overflow-y: auto;
  padding: var(--space-2);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
}

.auth-tree__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding-top: var(--space-4);
  margin-top: var(--space-4);
  border-top: 1px solid var(--color-border-soft);
}

.auth-tree__role {
  font-size: var(--text-xs);
}
</style>
