<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppSidebar from '@/layouts/AppSidebar.vue'
import BaseToastHost from '@/components/base/BaseToastHost.vue'
import AppBreadcrumb from '@/components/business/AppBreadcrumb.vue'
import ThemeIsland from '@/components/business/ThemeIsland.vue'
import { useMenuStore } from '@/stores/modules/menu'
import { useToast } from '@/composables/useToast'

/** 个人仪表盘布局：侧边栏菜单按后端 myMenuTree 动态渲染，顶部面包屑显示路由层级，主题灵动岛悬浮吸顶 */

const menuStore = useMenuStore()
const toast = useToast()

const navItems = computed(() => menuStore.navItems)

onMounted(async () => {
  if (menuStore.isLoaded) return
  try {
    await menuStore.fetchMenuTree()
  } catch {
    toast.error('菜单加载失败')
  }
})
</script>

<template>
  <div class="dashboard">
    <ThemeIsland />
    <AppSidebar :items="navItems" />

    <div class="dashboard__main">
      <header class="dashboard__head">
        <AppBreadcrumb />
      </header>
      <main class="dashboard__content">
        <RouterView />
      </main>
    </div>

    <BaseToastHost />
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  min-height: 100vh;
}

.dashboard__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.dashboard__head {
  position: sticky;
  top: 0;
  z-index: 40;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border-soft);
  background-color: color-mix(in srgb, var(--color-bg) 72%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dashboard__content {
  flex: 1;
  padding: var(--space-6);
}

@media (max-width: 768px) {
  .dashboard__content {
    padding: var(--space-4);
  }

  .dashboard__head {
    padding-left: var(--space-4);
  }
}
</style>
