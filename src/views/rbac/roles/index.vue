<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  page,
  detail,
  deleteUsingDelete,
  updateStatus,
  clone,
  exportUsingGet,
  importRoles,
} from '@/api/modules/rbac/rbacRole'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import RoleFormModal from '../components/RoleFormModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import StatusTag from '../components/StatusTag.vue'
import { DATA_SCOPE_LABEL, formatTime } from '../meta'

/** 角色管理：分页列表 + 检索 + 新建/编辑/克隆/启停/删除 + 导入导出 + 详情 */

const router = useRouter()
const { success, error } = useToast()

const loading = ref(false)
const roles = ref<API.RoleVO[]>([])
const total = ref(0)
const current = ref(1)
const size = 10

const filters = reactive({
  roleCode: '',
  roleName: '',
  status: '' as '' | 1 | 0,
})

const roleFormOpen = ref(false)
const editingRole = ref<API.RoleVO | null>(null)

const detailOpen = ref(false)
const detailRole = ref<API.RoleVO | null>(null)
const detailLoading = ref(false)

const importInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)

/* —— 确认弹窗（动态挂载回调） —— */
const confirmOpen = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmDanger = ref(false)
let confirmAction: (() => void) | null = null

function askConfirm(title: string, message: string, danger: boolean, action: () => void): void {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmDanger.value = danger
  confirmAction = action
  confirmOpen.value = true
}

function runConfirm(): void {
  confirmAction?.()
  confirmAction = null
  confirmOpen.value = false
}

async function fetchRoles(p = current.value): Promise<void> {
  loading.value = true
  try {
    const res = await page({
      query: {
        roleCode: filters.roleCode.trim() || undefined,
        roleName: filters.roleName.trim() || undefined,
        status: filters.status === '' ? undefined : filters.status,
        page: p,
        size,
      },
    })
    const data = res.data
    roles.value = data?.records ?? []
    total.value = data?.total ?? 0
    current.value = data?.current ?? p
  } catch (err) {
    error(readApiErrorMessage(err, '角色列表加载失败'))
  } finally {
    loading.value = false
  }
}

function search(): void {
  fetchRoles(1)
}

function reset(): void {
  filters.roleCode = ''
  filters.roleName = ''
  filters.status = ''
  fetchRoles(1)
}

function openCreate(): void {
  editingRole.value = null
  roleFormOpen.value = true
}

function openEdit(role: API.RoleVO): void {
  editingRole.value = role
  roleFormOpen.value = true
}

function onSaved(): void {
  roleFormOpen.value = false
  fetchRoles()
}

async function openDetail(role: API.RoleVO): Promise<void> {
  detailOpen.value = true
  detailRole.value = null
  detailLoading.value = true
  try {
    const res = await detail({ id: role.id ?? 0 })
    detailRole.value = res.data ?? null
  } catch (err) {
    error(readApiErrorMessage(err, '角色详情加载失败'))
  } finally {
    detailLoading.value = false
  }
}

function askDelete(role: API.RoleVO): void {
  askConfirm(
    '删除角色',
    `确定删除角色「${role.roleName ?? role.roleCode}」？内置角色禁删，有关联用户时后端会拒绝。`,
    true,
    () => doDelete(role),
  )
}

async function doDelete(role: API.RoleVO): Promise<void> {
  try {
    await deleteUsingDelete({ id: role.id ?? 0 })
    success('角色已删除')
    fetchRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '删除失败'))
  }
}

function askClone(role: API.RoleVO): void {
  askConfirm(
    '克隆角色',
    `将复制「${role.roleName ?? role.roleCode}」及其全部权限绑定，编码自动生成（源 + _COPY_ + 序号）。`,
    false,
    () => doClone(role),
  )
}

async function doClone(role: API.RoleVO): Promise<void> {
  try {
    const res = await clone({ sourceRoleId: role.id ?? 0 })
    success(`克隆完成，新角色 ID：${res.data ?? ''}`)
    fetchRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '克隆失败'))
  }
}

async function toggleStatus(role: API.RoleVO): Promise<void> {
  const next = role.status === 'NORMAL' ? 0 : 1
  try {
    await updateStatus({ id: role.id ?? 0 }, { status: next })
    success(role.status === 'NORMAL' ? '角色已停用' : '角色已启用')
    fetchRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '操作失败'))
  }
}

async function handleExport(): Promise<void> {
  try {
    const res = await exportUsingGet()
    downloadJson(res.data ?? [], `roles-export-${Date.now()}.json`)
    success('角色已导出')
  } catch (err) {
    error(readApiErrorMessage(err, '导出失败'))
  }
}

async function handleImport(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  importing.value = true
  try {
    const text = await file.text()
    const res = await importRoles({}, text)
    const report = res.data
    success(
      `导入完成：新增 ${report?.added?.length ?? 0}，复活 ${report?.revived?.length ?? 0}，残留停用 ${report?.deprecated?.length ?? 0}，忽略 ${report?.ignored?.length ?? 0}`,
    )
    fetchRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '导入失败'))
  } finally {
    importing.value = false
    if (importInput.value) importInput.value.value = ''
  }
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function gotoAuth(role: API.RoleVO): void {
  void router.push({ path: '/rbac/role-permissions', query: { roleId: String(role.id ?? '') } })
}

onMounted(() => fetchRoles())
</script>

<template>
  <div class="role-page">
    <!-- 检索 + 操作 -->
    <div class="card toolbar">
      <form class="toolbar__filters" novalidate @submit.prevent="search">
        <input
          v-model="filters.roleCode"
          class="input toolbar__input"
          type="text"
          placeholder="角色编码"
          spellcheck="false"
        />
        <input
          v-model="filters.roleName"
          class="input toolbar__input"
          type="text"
          placeholder="角色名称"
          spellcheck="false"
        />
        <select v-model="filters.status" class="select toolbar__input">
          <option value="">全部状态</option>
          <option :value="1">启用</option>
          <option :value="0">停用</option>
        </select>
        <button type="submit" class="btn btn--secondary">查询</button>
        <button type="button" class="btn btn--ghost" @click="reset">重置</button>
      </form>

      <div class="toolbar__actions">
        <button type="button" class="btn btn--primary" @click="openCreate">新建角色</button>
        <button type="button" class="btn btn--secondary" :disabled="importing" @click="handleExport">
          导出
        </button>
        <button type="button" class="btn btn--ghost" :disabled="importing" @click="importInput?.click()">
          导入
        </button>
        <input
          ref="importInput"
          type="file"
          accept="application/json,.json"
          class="toolbar__file"
          @change="handleImport"
        />
      </div>
    </div>

    <!-- 列表 -->
    <div class="card table-card">
      <div v-if="loading && roles.length === 0" class="table-card__empty">载入中…</div>
      <div v-else-if="roles.length === 0" class="table-card__empty">暂无角色</div>
      <div v-else class="table-card__wrap">
        <table class="table">
          <thead>
            <tr>
              <th>角色编码</th>
              <th>角色名称</th>
              <th>数据权限</th>
              <th>状态</th>
              <th>内置</th>
              <th>创建时间</th>
              <th class="table__ops">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="role in roles" :key="role.id">
              <td class="table__code">{{ role.roleCode }}</td>
              <td>{{ role.roleName }}</td>
              <td>{{ DATA_SCOPE_LABEL[role.dataScope ?? ''] ?? role.dataScope ?? '—' }}</td>
              <td><StatusTag :status="role.status" /></td>
              <td>
                <span v-if="role.isBuiltIn === 'YES'" class="tag">内置</span>
                <span v-else class="text--weak">—</span>
              </td>
              <td class="table__time">{{ formatTime(role.createTime) }}</td>
              <td class="table__ops">
                <div class="row-ops">
                  <button type="button" class="row-op" @click="openDetail(role)">详情</button>
                  <button type="button" class="row-op" @click="openEdit(role)">编辑</button>
                  <button type="button" class="row-op" @click="gotoAuth(role)">授权</button>
                  <button type="button" class="row-op" @click="askClone(role)">克隆</button>
                  <button type="button" class="row-op" @click="toggleStatus(role)">
                    {{ role.status === 'NORMAL' ? '停用' : '启用' }}
                  </button>
                  <button type="button" class="row-op row-op--danger" @click="askDelete(role)">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <BasePagination :current="current" :size="size" :total="total" @change="fetchRoles" />
    </div>

    <!-- 弹窗 -->
    <RoleFormModal :open="roleFormOpen" :role="editingRole" @close="roleFormOpen = false" @saved="onSaved" />
    <ConfirmModal
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :danger="confirmDanger"
      @close="confirmOpen = false"
      @confirm="runConfirm"
    />

    <!-- 详情 -->
    <BaseModal :open="detailOpen" title="角色详情" @close="detailOpen = false">
      <div v-if="detailLoading" class="detail-loading">载入中…</div>
      <div v-else-if="detailRole" class="detail">
        <dl class="detail__grid">
          <dt>角色编码</dt>
          <dd>{{ detailRole.roleCode }}</dd>
          <dt>角色名称</dt>
          <dd>{{ detailRole.roleName }}</dd>
          <dt>数据权限</dt>
          <dd>{{ DATA_SCOPE_LABEL[detailRole.dataScope ?? ''] ?? detailRole.dataScope ?? '—' }}</dd>
          <dt>状态</dt>
          <dd><StatusTag :status="detailRole.status" /></dd>
          <dt>备注</dt>
          <dd>{{ detailRole.remark || '—' }}</dd>
          <dt>创建时间</dt>
          <dd>{{ formatTime(detailRole.createTime) }}</dd>
        </dl>
        <div class="detail__perms">
          <p class="detail__perms-title">当前生效权限码</p>
          <div v-if="detailRole.permissionCodes?.length" class="detail__chips">
            <span v-for="code in detailRole.permissionCodes" :key="code" class="tag">{{ code }}</span>
          </div>
          <p v-else class="text--weak">无</p>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.role-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4);
}

.toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.toolbar__input {
  width: 150px;
}

.toolbar__actions {
  display: flex;
  gap: var(--space-2);
}

.toolbar__file {
  display: none;
}

.table-card {
  padding: var(--space-4);
}

.table-card__wrap {
  overflow-x: auto;
}

.table-card__empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-weak);
  font-size: var(--text-sm);
}

.table__code {
  font-family: var(--font-mono);
  color: var(--color-ink);
}

.table__time {
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

.detail-loading {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-weak);
}

.detail__grid {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: var(--space-2) var(--space-4);
  font-size: var(--text-sm);

  dt {
    color: var(--color-text-secondary);
  }

  dd {
    color: var(--color-text);
  }
}

.detail__perms {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border-soft);
}

.detail__perms-title {
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.detail__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
