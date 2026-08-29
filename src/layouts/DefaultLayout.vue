<script setup lang="ts">
import { computed, onMounted } from 'vue'
import AppSidebar from '@/layouts/AppSidebar.vue'
import ThemeIsland from '@/components/business/ThemeIsland.vue'
import { useMenuStore } from '@/stores/modules/menu'
import { useUserStore } from '@/stores/modules/user'
/** 单一认证布局：侧边栏按后端菜单树渲染（前端二次过滤），右上灵动岛，内容区 RouterView。
 *  菜单树由路由守卫在进入受保护路由前拉取并注册动态路由，本层仅做权限二次过滤生成导航项 */

const menuStore = useMenuStore()
const userStore = useUserStore()

const navItems = computed(() => menuStore.navItems)

onMounted(async () => {
  await userStore.fetchPermissions()
  menuStore.applyPermissions(userStore.permissions)
})
</script>

<template>
  <div class="layout">
    <ThemeIsland />
    <AppSidebar :items="navItems" />

    <div class="layout__main">
      <main class="layout__content">
        <RouterView />
      </main>
    </div>
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

.layout__content {
  flex: 1;
  padding: var(--space-6);
}

@media (max-width: 768px) {
  .layout__content {
    padding: var(--space-4);
  }
}
</style>
