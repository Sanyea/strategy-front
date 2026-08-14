<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/layouts/AppSidebar.vue'
import BaseToastHost from '@/components/base/BaseToastHost.vue'
import type { NavItem } from '@/layouts/AppSidebar.vue'

/** 管理后台布局：左侧导航（AppSidebar）+ 右侧内容区，页面标题取自路由 meta */

const route = useRoute()

const navItems: NavItem[] = [
  { label: '返回首页', icon: 'home', to: '/' },
  { label: '角色管理', icon: 'role', to: '/rbac/roles' },
  { label: '权限管理', icon: 'permission', to: '/rbac/permissions' },
  { label: '角色授权', icon: 'grant', to: '/rbac/role-permissions' },
  { label: '用户角色', icon: 'userrole', to: '/rbac/user-roles' },
]

const title = computed(() => (route.meta?.title as string | undefined) ?? '')
</script>

<template>
  <div class="admin">
    <AppSidebar :items="navItems" />

    <div class="admin__main">
      <header class="admin__head">
        <h1 class="admin__title">{{ title }}</h1>
      </header>
      <main class="admin__content">
        <RouterView />
      </main>
    </div>

    <BaseToastHost />
  </div>
</template>

<style scoped>
.admin {
  display: flex;
  min-height: 100vh;
}

.admin__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin__head {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-soft);
  background-color: color-mix(in srgb, var(--color-bg) 72%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.admin__title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  letter-spacing: 0.08em;
}

.admin__content {
  flex: 1;
  padding: var(--space-6);
}

@media (max-width: 768px) {
  .admin__content {
    padding: var(--space-4);
  }

  .admin__head {
    padding-left: var(--space-4);
  }
}
</style>
