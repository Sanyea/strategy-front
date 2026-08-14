<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppSidebar from '@/layouts/AppSidebar.vue'
import BaseToastHost from '@/components/base/BaseToastHost.vue'
import AppBreadcrumb from '@/components/business/AppBreadcrumb.vue'
import ThemeIsland from '@/components/business/ThemeIsland.vue'
import { useMenuStore } from '@/stores/modules/menu'
import { useUserStore } from '@/stores/modules/user'
import { useToast } from '@/composables/useToast'

/** 单一认证布局：侧边栏按后端菜单树渲染（前端二次过滤），顶部面包屑 + 灵动岛，内容区 RouterView */

const menuStore = useMenuStore()
const userStore = useUserStore()
const toast = useToast()

const navItems = computed(() => menuStore.navItems)

onMounted(async () => {
  try {
    await Promise.all([menuStore.fetchMenuTree(), userStore.fetchPermissions()])
    menuStore.applyPermissions(userStore.permissions)
  } catch {
    toast.error('菜单加载失败')
  }
})
</script>

<template>
  <div class="layout">
    <ThemeIsland />
    <AppSidebar :items="navItems" />

    <div class="layout__main">
      <header class="layout__head">
        <AppBreadcrumb />
      </header>
      <main class="layout__content">
        <RouterView />
      </main>
    </div>

    <BaseToastHost />
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.layout__head {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-soft);
  background-color: color-mix(in srgb, var(--color-bg) 72%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.layout__content {
  flex: 1;
  padding: var(--space-6);
}

@media (max-width: 768px) {
  .layout__content {
    padding: var(--space-4);
  }

  .layout__head {
    padding-left: var(--space-4);
  }
}
</style>
