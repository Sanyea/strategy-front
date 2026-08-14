<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import { hasPermission } from '@/utils/permission'
import RoleManage from './components/RoleManage.vue'
import RoleGrant from './components/RoleGrant.vue'
import UserRole from './components/UserRole.vue'

/** Role 管理页：页内三标签（角色管理 / 角色授权 / 用户角色），按权限码门控显隐，v-show 切换 */

const userStore = useUserStore()

/** 权限码 → 标签定义 */
const TABS = [
  { key: 'manage', label: '角色管理', code: 'system:role:manage' },
  { key: 'grant', label: '角色授权', code: 'system:role:assign' },
  { key: 'userRole', label: '用户角色', code: 'system:user:role:manage' },
] as const

/** 有权限码的可见标签（哨兵 * 视为全权限） */
const visibleTabs = computed(() => TABS.filter((t) => hasPermission(userStore.permissions, t.code)))

const active = ref<string>(TABS[0].key)

/** 权限码异步拉取：当前标签不可见时切到首个可见标签 */
watch(
  visibleTabs,
  (tabs) => {
    if (!tabs.some((t) => t.key === active.value)) {
      active.value = tabs[0]?.key ?? TABS[0].key
    }
  },
  { immediate: true },
)

/** 角色管理页「授权」入口跳转角色授权标签时携带的角色 ID */
const grantRoleId = ref<number | null>(null)

function onGotoAuth(roleId: number): void {
  grantRoleId.value = roleId
  active.value = 'grant'
}
</script>

<template>
  <div class="role-page">
    <div v-if="!visibleTabs.length" class="card role-empty">无权限访问角色管理</div>

    <template v-else>
      <!-- 标签栏 -->
      <div class="role-tabs" role="tablist" aria-label="角色管理功能">
        <button
          v-for="tab in visibleTabs"
          :key="tab.key"
          type="button"
          role="tab"
          class="role-tabs__tab"
          :class="{ 'is-active': active === tab.key }"
          @click="active = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- 标签内容（v-show 切换） -->
      <section v-show="active === 'manage'" role="tabpanel">
        <RoleManage @goto-auth="onGotoAuth" />
      </section>
      <section v-show="active === 'grant'" role="tabpanel">
        <RoleGrant :initial-role-id="grantRoleId" />
      </section>
      <section v-show="active === 'userRole'" role="tabpanel">
        <UserRole />
      </section>
    </template>
  </div>
</template>

<style scoped>
.role-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.role-tabs {
  display: inline-flex;
  gap: var(--space-1);
  padding: var(--space-1);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-full);
  background-color: var(--color-bg);
  align-self: flex-start;
}

.role-tabs__tab {
  padding: 6px 18px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    color: var(--color-ink);
  }

  &.is-active {
    background-color: var(--color-primary);
    color: var(--color-on-primary);
  }
}

.role-empty {
  padding: var(--space-8);
  text-align: center;
  color: var(--color-text-weak);
  font-size: var(--text-sm);
}

@media (prefers-reduced-motion: reduce) {
  .role-tabs__tab {
    transition: none;
  }
}
</style>
