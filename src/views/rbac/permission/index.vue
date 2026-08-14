<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { tree, delete1, updateStatus1, sync } from '@/api/modules/rbac/rbacPermission'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/base/BaseModal.vue'
import PermissionFormModal from '../components/PermissionFormModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import PermissionTreeTable from '../components/PermissionTreeTable.vue'

/** 权限管理：权限树 + 检索 + 新建/编辑/删除/启停 + 手动同步（dryRun 预览差异） */

const { success, error } = useToast()

const loading = ref(false)
const permTree = ref<API.PermissionVO[]>([])

const filters = reactive({
  permissionName: '',
  permissionType: '' as '' | 'DIRECTORY' | 'MENU' | 'BUTTON' | 'INTERFACE',
  permissionCode: '',
})

const formOpen = ref(false)
const editingPermission = ref<API.PermissionVO | null>(null)
const editingParentName = ref('')

/* 同步差异预览 */
const syncPreview = ref<API.SyncReport | null>(null)
const syncRunning = ref(false)

/* 确认弹窗 */
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

async function fetchTree(): Promise<void> {
  loading.value = true
  try {
    const res = await tree({
      query: {
        permissionName: filters.permissionName.trim() || undefined,
        permissionType: filters.permissionType === '' ? undefined : filters.permissionType,
        permissionCode: filters.permissionCode.trim() || undefined,
      },
    })
    permTree.value = res.data ?? []
  } catch (err) {
    error(readApiErrorMessage(err, '权限树加载失败'))
  } finally {
    loading.value = false
  }
}

function openCreateRoot(): void {
  editingPermission.value = null
  editingParentName.value = ''
  formOpen.value = true
}

function openAddChild(parent: API.PermissionVO): void {
  const draft: API.PermissionVO = { parentId: parent.id, permissionName: '' }
  editingPermission.value = draft
  editingParentName.value = parent.permissionName ?? ''
  formOpen.value = true
}

function openEdit(node: API.PermissionVO): void {
  editingPermission.value = node
  editingParentName.value = findParentName(permTree.value, node.parentId)
  formOpen.value = true
}

/** 由 id 向上查找父节点名称（树渲染用） */
function findParentName(nodes: API.PermissionVO[], parentId?: number): string {
  if (!parentId) return ''
  for (const node of nodes) {
    if (node.id === parentId) return node.permissionName ?? ''
    if (node.children?.length) {
      const name = findParentName(node.children, parentId)
      if (name) return name
    }
  }
  return ''
}

function onSaved(): void {
  formOpen.value = false
  fetchTree()
}

function askDelete(node: API.PermissionVO): void {
  askConfirm(
    '删除权限',
    `确定删除「${node.permissionName}」？内置资源禁删，有角色绑定时后端会拒绝。`,
    true,
    () => doDelete(node),
  )
}

async function doDelete(node: API.PermissionVO): Promise<void> {
  try {
    await delete1({ id: node.id ?? 0 })
    success('权限已删除')
    fetchTree()
  } catch (err) {
    error(readApiErrorMessage(err, '删除失败'))
  }
}

async function toggleStatus(node: API.PermissionVO): Promise<void> {
  const next = node.status === 'NORMAL' ? 0 : 1
  try {
    await updateStatus1({ id: node.id ?? 0 }, { status: next })
    success(node.status === 'NORMAL' ? '权限已停用' : '权限已启用')
    fetchTree()
  } catch (err) {
    error(readApiErrorMessage(err, '操作失败'))
  }
}

function askSyncPreview(): void {
  askConfirm('同步权限', '同步将：新增 + 复活 + 残留停用（对比后端接口注册表）。先预览差异，确认后执行。', false, previewSync)
}

async function previewSync(): Promise<void> {
  syncRunning.value = true
  try {
    const res = await sync({ dryRun: true })
    syncPreview.value = res.data ?? null
  } catch (err) {
    error(readApiErrorMessage(err, '同步预览失败'))
  } finally {
    syncRunning.value = false
  }
}

async function executeSync(): Promise<void> {
  syncRunning.value = true
  try {
    const res = await sync({})
    const report = res.data
    success(
      `同步完成：新增 ${report?.added?.length ?? 0}，复活 ${report?.revived?.length ?? 0}，残留停用 ${report?.deprecated?.length ?? 0}，忽略 ${report?.ignored?.length ?? 0}`,
    )
    syncPreview.value = null
    fetchTree()
  } catch (err) {
    error(readApiErrorMessage(err, '同步执行失败'))
  } finally {
    syncRunning.value = false
  }
}

function reset(): void {
  filters.permissionName = ''
  filters.permissionType = ''
  filters.permissionCode = ''
  fetchTree()
}

onMounted(() => fetchTree())
</script>

<template>
  <div class="perm-page">
    <div class="card toolbar">
      <form class="toolbar__filters" novalidate @submit.prevent="fetchTree">
        <input
          v-model="filters.permissionName"
          class="input toolbar__input"
          type="text"
          placeholder="资源名称"
          spellcheck="false"
        />
        <select v-model="filters.permissionType" class="select toolbar__input">
          <option value="">全部类型</option>
          <option value="DIRECTORY">目录</option>
          <option value="MENU">菜单</option>
          <option value="BUTTON">按钮</option>
          <option value="INTERFACE">接口</option>
        </select>
        <input
          v-model="filters.permissionCode"
          class="input toolbar__input"
          type="text"
          placeholder="权限标识"
          spellcheck="false"
        />
        <button type="submit" class="btn btn--secondary" :disabled="loading">查询</button>
        <button type="button" class="btn btn--ghost" @click="reset">重置</button>
      </form>

      <div class="toolbar__actions">
        <button type="button" class="btn btn--primary" @click="openCreateRoot">新建权限</button>
        <button type="button" class="btn btn--secondary" :disabled="syncRunning" @click="askSyncPreview">
          同步
        </button>
      </div>
    </div>

    <div class="card table-card">
      <div v-if="loading && permTree.length === 0" class="table-card__empty">载入中…</div>
      <div v-else-if="permTree.length === 0" class="table-card__empty">暂无权限资源</div>
      <div v-else class="table-card__wrap">
        <table class="table">
          <thead>
            <tr>
              <th>资源名称</th>
              <th>类型</th>
              <th>权限标识</th>
              <th>状态</th>
              <th>创建时间</th>
              <th class="table__ops">操作</th>
            </tr>
          </thead>
          <tbody>
            <PermissionTreeTable
              :nodes="permTree"
              @add="openAddChild"
              @edit="openEdit"
              @del="askDelete"
              @toggle="toggleStatus"
            />
          </tbody>
        </table>
      </div>
    </div>

    <PermissionFormModal
      :open="formOpen"
      :permission="editingPermission"
      :parent-name="editingParentName"
      @close="formOpen = false"
      @saved="onSaved"
    />
    <ConfirmModal
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :danger="confirmDanger"
      @close="confirmOpen = false"
      @confirm="runConfirm"
    />

    <!-- 同步差异预览 -->
    <BaseModal :open="syncPreview !== null" title="同步差异预览" @close="syncPreview = null">
      <div class="sync-report">
        <div class="sync-report__group">
          <p class="sync-report__title sync-report__title--add">新增（{{ syncPreview?.added?.length ?? 0 }}）</p>
          <div class="sync-report__chips">
            <span v-for="c in syncPreview?.added ?? []" :key="c" class="tag">{{ c }}</span>
            <span v-if="!syncPreview?.added?.length" class="text--weak">无</span>
          </div>
        </div>
        <div class="sync-report__group">
          <p class="sync-report__title sync-report__title--revive">复活（{{ syncPreview?.revived?.length ?? 0 }}）</p>
          <div class="sync-report__chips">
            <span v-for="c in syncPreview?.revived ?? []" :key="c" class="tag">{{ c }}</span>
            <span v-if="!syncPreview?.revived?.length" class="text--weak">无</span>
          </div>
        </div>
        <div class="sync-report__group">
          <p class="sync-report__title sync-report__title--dep">残留停用（{{ syncPreview?.deprecated?.length ?? 0 }}）</p>
          <div class="sync-report__chips">
            <span v-for="c in syncPreview?.deprecated ?? []" :key="c" class="tag">{{ c }}</span>
            <span v-if="!syncPreview?.deprecated?.length" class="text--weak">无</span>
          </div>
        </div>
        <div class="sync-report__group">
          <p class="sync-report__title sync-report__title--ign">忽略告警（{{ syncPreview?.ignored?.length ?? 0 }}）</p>
          <div class="sync-report__chips">
            <span v-for="c in syncPreview?.ignored ?? []" :key="c" class="tag">{{ c }}</span>
            <span v-if="!syncPreview?.ignored?.length" class="text--weak">无</span>
          </div>
        </div>
      </div>

      <template #footer>
        <button type="button" class="btn btn--ghost" :disabled="syncRunning" @click="syncPreview = null">
          取消
        </button>
        <button type="button" class="btn btn--primary" :disabled="syncRunning" @click="executeSync">
          {{ syncRunning ? '执行中…' : '确认执行' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.perm-page {
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

.table__ops {
  white-space: nowrap;
  text-align: right;
}

.sync-report {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.sync-report__title {
  margin-bottom: var(--space-2);
  font-size: var(--text-sm);
}

.sync-report__title--add {
  color: var(--color-accent-green);
}

.sync-report__title--revive {
  color: var(--color-accent-blue);
}

.sync-report__title--dep {
  color: var(--color-danger);
}

.sync-report__title--ign {
  color: var(--color-text-weak);
}

.sync-report__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
