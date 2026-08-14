import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { getToken } from '@/api/modules/request'
import { useMenuStore } from '@/stores/modules/menu'
import { useUserStore } from '@/stores/modules/user'
import {
  ensureCatchAll,
  firstDynamicPath,
  hasCatchAll,
  installDynamicRoutes,
  markDynamicInstallAttempted,
  shouldLoadDynamicRoutes,
} from './dynamic'

/**
 * 基础公共静态路由：仅首页 / 登入注册。
 * 其余受保护路由由后端 myMenuTree 动态注册（src/router/dynamic.ts），
 * 404 兜底在动态路由全部 addRoute 完成之后注册，避免拦截动态路由。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/index.vue'),
    meta: { title: '云岫工作台' },
  },
  {
    path: '/login',
    name: 'auth',
    component: () => import('@/views/auth/index.vue'),
    meta: { title: '登入 · 注册' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 全局守卫：动态路由按需装载（404 最后注册）+ 登入校验
router.beforeEach(async (to) => {
  const authed = Boolean(getToken())

  // 未登入：注册公共 404（幂等），未知路径命中 404，登入/首页正常放行
  if (!authed && !hasCatchAll()) {
    ensureCatchAll(router)
    return { path: to.fullPath, replace: true }
  }

  // 已登入但动态路由未装：拉菜单装动态路由（404 最后注册）后重入本次导航。
  // 公共基础页（首页/登入页）除外——避免访问登入页误触发拉取
  const isPublicBase = to.name === 'home' || to.name === 'auth'
  if (authed && !isPublicBase && shouldLoadDynamicRoutes()) {
    const menuStore = useMenuStore()
    const userStore = useUserStore()
    try {
      // 并行拉菜单树 + 权限码集，装路由前按 perms 二次过滤（与侧边栏一致）
      await Promise.all([menuStore.fetchMenuTree(), userStore.fetchPermissions()])
      installDynamicRoutes(router, menuStore.tree, userStore.permissions)
    } catch {
      // 拉取失败：标记已尝试 + 注册公共 404，防空拉死循环且未知路径不白屏
      markDynamicInstallAttempted()
      ensureCatchAll(router)
      // 拉取中凭证被清除（401 刷新失败）→ 会话失效，回登入页而非 404
      if (!getToken()) {
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }
    return { path: to.fullPath, replace: true }
  }

  // 登入守卫：受保护路由需凭证；已登入访问登入页则回跳
  if (to.matched.some((record) => record.meta.requiresAuth) && !authed) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'auth' && authed) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : ''
    // 已装路由时回跳真实存在的首条动态路由；未装回落 /dashboard（由该导航触发装载）
    return redirect.startsWith('/') && !redirect.startsWith('//')
      ? redirect
      : (firstDynamicPath(router) || '/dashboard')
  }

  // 已登入 + 目标仅命中 404 兜底（不存在或无权限路由）：如实显示 404 页，不重定向
})

// 路由切换后同步浏览器标题
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  document.title = title ? `${title} · 云岫` : '云岫工作台'
})

export default router
