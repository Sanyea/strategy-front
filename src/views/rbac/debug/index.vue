<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { check, effective, evictUser, evictBatch, task } from '@/api/modules/rbac/rbacDebug'
import { readApiErrorMessage } from '@/utils/error'
import { useToast } from '@/composables/useToast'
import BaseModal from '@/components/base/BaseModal.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import { formatTime } from '../meta'

/** Debug 权限排查：用户权限校验 / 生效权限 / 踢人 / 批量踢（async 轮询任务） */

const { success, error } = useToast()

/* —— 一、权限校验 —— */
const checkUserId = ref<number | null>(null)
const checkPerm = ref('')
const checkResult = ref<boolean | null>(null)
const checking = ref(false)

async function runCheck(): Promise<void> {
  if (checkUserId.value == null) {
    error('请输入用户 ID')
    return
  }
  if (!checkPerm.value.trim()) {
    error('请输入权限标识')
    return
  }
  checking.value = true
  try {
    const res = await check({ id: checkUserId.value, permission: checkPerm.value.trim() })
    checkResult.value = !!res.data
  } catch (err) {
    error(readApiErrorMessage(err, '权限校验失败'))
  } finally {
    checking.value = false
  }
}

/* —— 二、用户生效权限 —— */
const effUserId = ref<number | null>(null)
const effPerms = ref<string[]>([])
const effLoading = ref(false)
const effShown = ref(false)

async function runEffective(): Promise<void> {
  if (effUserId.value == null) {
    error('请输入用户 ID')
    return
  }
  effLoading.value = true
  effShown.value = true
  try {
    const res = await effective({ id: effUserId.value })
    effPerms.value = res.data ?? []
  } catch (err) {
    effPerms.value = []
    error(readApiErrorMessage(err, '生效权限查询失败'))
  } finally {
    effLoading.value = false
  }
}

/* —— 三、踢单用户 —— */
const evictUserId = ref<number | null>(null)
const confirmOpen = ref(false)
let confirmAction: (() => void) | null = null

function askEvictUser(): void {
  if (evictUserId.value == null) {
    error('请输入用户 ID')
    return
  }
  confirmOpen.value = true
  confirmAction = () => doEvictUser(evictUserId.value as number)
}

function runConfirm(): void {
  confirmAction?.()
  confirmAction = null
  confirmOpen.value = false
}

async function doEvictUser(id: number): Promise<void> {
  try {
    await evictUser({ id })
    success(`用户 ${id} 已踢下线`)
  } catch (err) {
    error(readApiErrorMessage(err, '踢人失败'))
  }
}

/* —— 四、批量踢（async 轮询） —— */
const batchRoleId = ref<number | null>(null)
const batchMode = ref<'sync' | 'async'>('async')
const taskOpen = ref(false)
const taskVO = ref<API.EvictTaskVO | null>(null)
const polling = ref(false)
let pollTimer: number | null = null

async function runEvictBatch(): Promise<void> {
  if (batchRoleId.value == null) {
    error('请输入角色 ID')
    return
  }
  try {
    const res = await evictBatch({ roleId: batchRoleId.value, mode: batchMode.value })
    const vo = res.data
    if (batchMode.value === 'sync') {
      success(`同步踢出完成，命中 ${vo?.kicked ?? 0} 会话`)
      return
    }
    // async：打开进度弹窗并轮询
    taskOpen.value = true
    taskVO.value = vo ?? null
    if (vo?.taskId) startPolling(vo.taskId)
  } catch (err) {
    error(readApiErrorMessage(err, '批量踢失败'))
  }
}

function startPolling(taskId: string): void {
  polling.value = true
  pollTimer = window.setInterval(async () => {
    try {
      const res = await task({ taskId })
      taskVO.value = res.data ?? null
      const status = taskVO.value?.status
      if (status === 'SUCCESS' || status === 'FAILED') {
        stopPolling()
        if (status === 'SUCCESS') success('批量踢任务完成')
        else error(`任务失败：${taskVO.value?.error ?? '未知原因'}`)
      }
    } catch {
      stopPolling()
      error('任务进度查询失败')
    }
  }, 2000)
}

function stopPolling(): void {
  polling.value = false
  if (pollTimer != null) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

onBeforeUnmount(stopPolling)
</script>

<template>
  <div class="debug-page">
    <!-- 一、权限校验 -->
    <section class="card card--debug">
      <h2 class="card--debug__title">权限校验</h2>
      <div class="card--debug__toolbar">
        <input v-model.number="checkUserId" class="input dbg-input" type="number" placeholder="用户 ID" />
        <input
          v-model="checkPerm"
          class="input dbg-input dbg-input--wide"
          type="text"
          placeholder="权限标识，如 system:role:manage"
          spellcheck="false"
        />
        <button type="button" class="btn btn--secondary" :disabled="checking" @click="runCheck">
          {{ checking ? '校验中…' : '校验' }}
        </button>
      </div>
      <p v-if="checkResult != null" class="dbg-result" :class="{ 'is-ok': checkResult }">
        {{ checkResult ? '拥有该权限' : '无该权限' }}
      </p>
    </section>

    <!-- 二、用户生效权限 -->
    <section class="card card--debug">
      <h2 class="card--debug__title">用户生效权限</h2>
      <div class="card--debug__toolbar">
        <input v-model.number="effUserId" class="input dbg-input" type="number" placeholder="用户 ID" />
        <button type="button" class="btn btn--secondary" :disabled="effLoading" @click="runEffective">
          {{ effLoading ? '查询中…' : '查询' }}
        </button>
      </div>
      <div v-if="effShown" class="dbg-chips">
        <span v-if="effLoading" class="text--weak">载入中…</span>
        <template v-else>
          <span v-for="code in effPerms" :key="code" class="tag">{{ code }}</span>
          <span v-if="!effPerms.length" class="text--weak">无生效权限</span>
        </template>
      </div>
    </section>

    <!-- 三、踢单用户 -->
    <section class="card card--debug">
      <h2 class="card--debug__title">踢单用户</h2>
      <div class="card--debug__toolbar">
        <input v-model.number="evictUserId" class="input dbg-input" type="number" placeholder="用户 ID" />
        <button type="button" class="btn btn--secondary" @click="askEvictUser">踢下线</button>
      </div>
    </section>

    <!-- 四、批量踢 -->
    <section class="card card--debug">
      <h2 class="card--debug__title">批量踢</h2>
      <div class="card--debug__toolbar">
        <input v-model.number="batchRoleId" class="input dbg-input" type="number" placeholder="角色 ID" />
        <select v-model="batchMode" class="select dbg-select">
          <option value="sync">同步</option>
          <option value="async">异步</option>
        </select>
        <button type="button" class="btn btn--primary" @click="runEvictBatch">执行</button>
      </div>
      <p class="card--debug__hint text--weak">异步模式后台执行，返回任务进度弹窗轮询；变更自动踢该角色下用户重登。</p>
    </section>

    <ConfirmModal
      :open="confirmOpen"
      title="踢用户下线"
      message="确定将该用户踢下线？写 jti 黑名单，该用户下次请求将强制重新登入。"
      danger
      @close="confirmOpen = false"
      @confirm="runConfirm"
    />

    <!-- 批量踢任务进度 -->
    <BaseModal :open="taskOpen" title="批量踢任务" @close="taskOpen = false">
      <div v-if="taskVO" class="task">
        <dl class="task__grid">
          <dt>任务 ID</dt>
          <dd class="task__mono">{{ taskVO.taskId ?? '—' }}</dd>
          <dt>来源</dt>
          <dd>{{ taskVO.sourceDesc ?? '—' }}</dd>
          <dt>状态</dt>
          <dd>{{ taskVO.status ?? '—' }}{{ polling ? '…' : '' }}</dd>
          <dt>命中会话</dt>
          <dd>{{ taskVO.kicked ?? '—' }}</dd>
          <dt>完成时间</dt>
          <dd>{{ formatTime(taskVO.doneAt) }}</dd>
        </dl>
        <p v-if="taskVO.error" class="task__error">{{ taskVO.error }}</p>
      </div>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="taskOpen = false">关闭</button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.debug-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.card--debug {
  padding: var(--space-5);
}

.card--debug__title {
  margin-bottom: var(--space-4);
  font-family: var(--font-display);
  font-size: var(--text-md);
  letter-spacing: 0.06em;
}

.card--debug__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.card--debug__hint {
  margin-top: var(--space-2);
  font-size: var(--text-xs);
}

.dbg-input {
  width: 140px;
}

.dbg-input--wide {
  width: 280px;
}

.dbg-select {
  width: 110px;
}

.dbg-result {
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);

  &.is-ok {
    color: var(--color-accent-green);
  }
}

.dbg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.task__grid {
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

.task__mono {
  font-family: var(--font-mono);
}

.task__error {
  margin-top: var(--space-3);
  color: var(--color-danger);
  font-size: var(--text-sm);
}
</style>
