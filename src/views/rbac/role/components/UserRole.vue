<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { page as pageRoles } from '@/api/modules/rbac/rbacRole'
import {
  expiring,
  renewBatch,
  userRoles,
  replace,
  unbind,
  renew,
  assignBatch,
} from '@/api/modules/rbac/rbacUserRole'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmModal from '../../components/ConfirmModal.vue'
import { formatTime, toIso, toLocalInput } from '../../meta'

/** 用户角色：按用户查角色（续期/解绑/覆盖）+ 批量授角色 + 到期预警批量续期 */

const { success, error } = useToast()

const roles = ref<API.RoleVO[]>([])

/* —— 一、按用户查角色 —— */
const userId = ref<number | null>(null)
const userRoleList = ref<API.UserRoleVO[]>([])
const queryingUser = ref(false)

/* —— 二、批量授角色 —— */
const assignForm = reactive({
  userIds: '',
  roleId: null as number | null,
  beginTime: '',
  endTime: '',
})

/* —— 三、到期预警 —— */
const days = ref(7)
const expiringList = ref<API.UserRoleVO[]>([])
const expiringTotal = ref(0)
const expiringCurrent = ref(1)
const expiringSize = 10
const loadingExpiring = ref(false)
const selectedBindIds = ref<number[]>([])

/* 续期弹窗（单条 / 批量复用） */
const renewOpen = ref(false)
const renewEnd = ref('')
const renewing = ref(false)
let renewTarget: { bindIds: number[]; userId?: number; roleId?: number } | null = null

/* 覆盖角色弹窗 */
const replaceOpen = ref(false)
const replaceChecked = ref<number[]>([])
const replaceBegin = ref('')
const replaceEnd = ref('')

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

async function loadRoles(): Promise<void> {
  try {
    const res = await pageRoles({ query: { size: 100 } })
    roles.value = res.data?.records ?? []
  } catch (err) {
    error(readApiErrorMessage(err, '角色列表加载失败'))
  }
}

async function queryUserRoles(): Promise<void> {
  if (userId.value == null) {
    error('请输入用户 ID')
    return
  }
  queryingUser.value = true
  try {
    const res = await userRoles({ id: userId.value })
    userRoleList.value = res.data ?? []
  } catch (err) {
    error(readApiErrorMessage(err, '用户角色查询失败'))
  } finally {
    queryingUser.value = false
  }
}

function openRenewSingle(row: API.UserRoleVO): void {
  renewTarget = { bindIds: [row.id ?? 0], userId: row.userId, roleId: row.roleId }
  renewEnd.value = toLocalInput(row.endTime) ?? ''
  renewOpen.value = true
}

function openRenewBatch(): void {
  if (!selectedBindIds.value.length) {
    error('请先勾选要续期的绑定')
    return
  }
  renewTarget = { bindIds: selectedBindIds.value }
  renewEnd.value = ''
  renewOpen.value = true
}

async function doRenew(): Promise<void> {
  if (!renewTarget) return
  const endTime = toIso(renewEnd.value)
  if (!endTime) {
    error('请选择新的结束时间')
    return
  }
  renewing.value = true
  try {
    if (renewTarget.userId != null && renewTarget.roleId != null) {
      await renew({ id: renewTarget.userId, roleId: renewTarget.roleId }, { endTime })
    } else {
      await renewBatch({ bindIds: renewTarget.bindIds, endTime })
    }
    success('已续期')
    renewOpen.value = false
    selectedBindIds.value = []
    void refreshExpiring()
    if (userId.value != null) void queryUserRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '续期失败'))
  } finally {
    renewing.value = false
  }
}

function askUnbind(row: API.UserRoleVO): void {
  askConfirm(
    '解绑角色',
    `确定解绑用户 ${row.userId} 的角色「${row.roleName ?? row.roleCode}」？变更将自动踢该用户重登。`,
    true,
    () => doUnbind(row),
  )
}

async function doUnbind(row: API.UserRoleVO): Promise<void> {
  try {
    await unbind({ id: row.userId ?? 0, roleId: row.roleId ?? 0 })
    success('已解绑')
    if (userId.value != null) void queryUserRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '解绑失败'))
  }
}

function openReplace(): void {
  if (userId.value == null) {
    error('请先查询用户角色')
    return
  }
  replaceChecked.value = userRoleList.value.map((r) => r.roleId).filter((x): x is number => x != null)
  replaceBegin.value = ''
  replaceEnd.value = ''
  replaceOpen.value = true
}

async function doReplace(): Promise<void> {
  if (userId.value == null) return
  try {
    const begin = toIso(replaceBegin.value)
    const end = toIso(replaceEnd.value)
    await replace(
      { id: userId.value },
      replaceChecked.value.map((roleId) => ({ roleId, beginTime: begin, endTime: end })),
    )
    success('用户角色已覆盖')
    replaceOpen.value = false
    void queryUserRoles()
  } catch (err) {
    error(readApiErrorMessage(err, '覆盖失败'))
  }
}

async function doAssign(): Promise<void> {
  const ids = assignForm.userIds
    .split(/[,，\s]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0)
  if (!ids.length) {
    error('请填写目标用户 ID')
    return
  }
  if (assignForm.roleId == null) {
    error('请选择角色')
    return
  }
  try {
    await assignBatch({
      userIds: ids,
      roleId: assignForm.roleId,
      beginTime: toIso(assignForm.beginTime),
      endTime: toIso(assignForm.endTime),
    })
    success(`已为 ${ids.length} 位用户授角色`)
    assignForm.userIds = ''
  } catch (err) {
    error(readApiErrorMessage(err, '授角色失败'))
  }
}

async function fetchExpiring(p = expiringCurrent.value): Promise<void> {
  loadingExpiring.value = true
  try {
    const res = await expiring({
      query: { days: days.value || undefined, page: p, size: expiringSize },
    })
    const data = res.data
    expiringList.value = data?.records ?? []
    expiringTotal.value = data?.total ?? 0
    expiringCurrent.value = data?.current ?? p
  } catch (err) {
    error(readApiErrorMessage(err, '到期列表加载失败'))
  } finally {
    loadingExpiring.value = false
  }
}

function refreshExpiring(): Promise<void> {
  return fetchExpiring(expiringCurrent.value)
}

function toggleSelect(id?: number): void {
  if (id == null) return
  const index = selectedBindIds.value.indexOf(id)
  if (index >= 0) selectedBindIds.value.splice(index, 1)
  else selectedBindIds.value.push(id)
}

function toggleSelectAll(): void {
  const ids = expiringList.value.map((r) => r.id).filter((x): x is number => x != null)
  selectedBindIds.value = selectedBindIds.value.length === ids.length ? [] : ids
}

onMounted(() => {
  loadRoles()
  fetchExpiring()
})
</script>

<template>
  <div class="ur-page">
    <!-- 一、按用户查角色 -->
    <div class="card ur-card">
      <h2 class="ur-card__title">按用户查角色</h2>
      <div class="ur-card__toolbar">
        <input
          v-model.number="userId"
          class="input ur-user-input"
          type="number"
          placeholder="用户 ID"
        />
        <button type="button" class="btn btn--secondary" :disabled="queryingUser" @click="queryUserRoles">
          {{ queryingUser ? '查询中…' : '查询' }}
        </button>
      </div>

      <div v-if="userRoleList.length" class="ur-card__body">
        <table class="table">
          <thead>
            <tr>
              <th>角色编码</th>
              <th>角色名称</th>
              <th>生效开始</th>
              <th>生效结束</th>
              <th>授权人</th>
              <th class="table__ops">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in userRoleList" :key="row.id">
              <td class="table__code">{{ row.roleCode ?? '—' }}</td>
              <td>{{ row.roleName ?? '—' }}</td>
              <td class="table__time">{{ formatTime(row.beginTime) }}</td>
              <td class="table__time">{{ formatTime(row.endTime) }}</td>
              <td class="table__time">{{ row.assignerId ?? '—' }}</td>
              <td class="table__ops">
                <div class="row-ops">
                  <button type="button" class="row-op" @click="openRenewSingle(row)">续期</button>
                  <button type="button" class="row-op" @click="openReplace">覆盖</button>
                  <button type="button" class="row-op row-op--danger" @click="askUnbind(row)">解绑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="ur-card__empty">查询用户 ID 后展示其当前角色绑定</p>
    </div>

    <!-- 二、批量授角色 -->
    <div class="card ur-card">
      <h2 class="ur-card__title">批量授角色</h2>
      <div class="ur-card__toolbar ur-card__toolbar--wrap">
        <input
          v-model="assignForm.userIds"
          class="input ur-user-input"
          type="text"
          placeholder="用户 ID，多个用逗号分隔"
          spellcheck="false"
        />
        <select v-model="assignForm.roleId" class="select ur-role-select">
          <option :value="null" disabled>选择角色</option>
          <option v-for="r in roles" :key="r.id" :value="r.id">
            {{ r.roleName ?? r.roleCode }}（{{ r.roleCode }}）
          </option>
        </select>
        <input v-model="assignForm.beginTime" class="input ur-time-input" type="datetime-local" />
        <input v-model="assignForm.endTime" class="input ur-time-input" type="datetime-local" />
        <button type="button" class="btn btn--primary" @click="doAssign">授角色</button>
      </div>
      <p class="ur-card__hint text--weak">生效时间留空即不限制；变更自动踢受影响用户重登。</p>
    </div>

    <!-- 三、到期预警 -->
    <div class="card ur-card">
      <h2 class="ur-card__title">到期预警</h2>
      <div class="ur-card__toolbar">
        <label class="ur-days-label" for="ur-days">预警天数</label>
        <input id="ur-days" v-model.number="days" class="input ur-days-input" type="number" min="0" />
        <button type="button" class="btn btn--secondary" :disabled="loadingExpiring" @click="fetchExpiring(1)">
          查询
        </button>
        <button type="button" class="btn btn--primary" :disabled="!selectedBindIds.length" @click="openRenewBatch">
          批量续期（{{ selectedBindIds.length }}）
        </button>
      </div>

      <div v-if="loadingExpiring && expiringList.length === 0" class="ur-card__empty">载入中…</div>
      <div v-else-if="expiringList.length" class="ur-card__body">
        <table class="table">
          <thead>
            <tr>
              <th class="ur-check">
                <input type="checkbox" :checked="selectedBindIds.length === expiringList.length" @change="toggleSelectAll" />
              </th>
              <th>用户 ID</th>
              <th>角色</th>
              <th>生效结束</th>
              <th>授权人</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in expiringList" :key="row.id">
              <td class="ur-check">
                <input type="checkbox" :checked="selectedBindIds.includes(row.id ?? -1)" @change="toggleSelect(row.id)" />
              </td>
              <td>{{ row.userId }}</td>
              <td>{{ row.roleName ?? row.roleCode ?? row.roleId }}</td>
              <td class="table__time">{{ formatTime(row.endTime) }}</td>
              <td class="table__time">{{ row.assignerId ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
        <BasePagination :current="expiringCurrent" :size="expiringSize" :total="expiringTotal" @change="fetchExpiring" />
      </div>
      <p v-else class="ur-card__empty">暂无即将到期绑定</p>
    </div>

    <!-- 续期弹窗 -->
    <BaseModal :open="renewOpen" title="角色续期" width="420px" @close="renewOpen = false">
      <div class="field">
        <label class="field__label" for="renew-end">新的结束时间</label>
        <input id="renew-end" v-model="renewEnd" class="input" type="datetime-local" />
        <p class="ur-hint text--weak">续期仅延长 end_time，权限不变化无需踢人。</p>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" :disabled="renewing" @click="renewOpen = false">取消</button>
        <button type="button" class="btn btn--primary" :disabled="renewing" @click="doRenew">
          {{ renewing ? '续期中…' : '确认续期' }}
        </button>
      </template>
    </BaseModal>

    <!-- 覆盖角色弹窗 -->
    <BaseModal :open="replaceOpen" title="覆盖用户角色" width="480px" @close="replaceOpen = false">
      <p class="ur-hint text--weak">勾选后将全量替换该用户现有角色；时间留空即不限制。</p>
      <div class="replace-list">
        <label v-for="r in roles" :key="r.id" class="replace-item">
          <input v-model="replaceChecked" type="checkbox" :value="r.id" />
          <span>{{ r.roleName ?? r.roleCode }}（{{ r.roleCode }}）</span>
        </label>
      </div>
      <div class="replace-times">
        <div class="field">
          <label class="field__label" for="replace-begin">生效开始</label>
          <input id="replace-begin" v-model="replaceBegin" class="input" type="datetime-local" />
        </div>
        <div class="field">
          <label class="field__label" for="replace-end">生效结束</label>
          <input id="replace-end" v-model="replaceEnd" class="input" type="datetime-local" />
        </div>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="replaceOpen = false">取消</button>
        <button type="button" class="btn btn--primary" @click="doReplace">保存</button>
      </template>
    </BaseModal>

    <ConfirmModal
      :open="confirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :danger="confirmDanger"
      @close="confirmOpen = false"
      @confirm="runConfirm"
    />
  </div>
</template>

<style scoped>
.ur-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.ur-card {
  padding: var(--space-5);
}

.ur-card__title {
  margin-bottom: var(--space-4);
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.06em;
}

.ur-card__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.ur-card__toolbar--wrap {
  row-gap: var(--space-3);
}

.ur-card__body {
  margin-top: var(--space-4);
  overflow-x: auto;
}

.ur-card__empty {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-weak);
  font-size: var(--text-sm);
}

.ur-user-input {
  width: 180px;
}

.ur-role-select {
  width: 220px;
}

.ur-time-input {
  width: 190px;
}

.ur-days-input {
  width: 90px;
}

.ur-days-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.ur-card__hint {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
}

.ur-hint {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
}

.ur-check {
  width: 36px;

  input {
    accent-color: var(--color-primary);
  }
}

.table__code {
  font-family: var(--font-mono);
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

.replace-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  max-height: 220px;
  overflow-y: auto;
  padding: var(--space-3);
  margin-block: var(--space-3);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-sm);
}

.replace-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);

  input {
    accent-color: var(--color-primary);
  }
}

.replace-times {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}
</style>
