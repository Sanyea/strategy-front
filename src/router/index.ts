import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { getToken } from '@/api/modules/request'

/** 路由表：工作台首页 + 登入/注册页（BlankLayout 形态，页面自带布局） */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/home/index.vue'),
    meta: { title: '云岫工作台' },
  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/DefaultLayout.vue'),
    meta: { title: '个人仪表盘', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '个人仪表盘', requiresAuth: true },
      },
    ],
  },
  {
    path: '/login',
    name: 'auth',
    component: () => import('@/views/auth/index.vue'),
    meta: { title: '登入 · 注册' },
  },
  {
    path: '/rbac',
    component: () => import('@/layouts/DefaultLayout.vue'),
    redirect: '/rbac/debug',
    meta: { title: '权限管理', requiresAuth: true },
    children: [
      {
        path: 'debug',
        name: 'rbac-debug',
        component: () => import('@/views/rbac/debug/index.vue'),
        meta: { title: 'Debug 权限排查', requiresAuth: true },
      },
      {
        path: 'permission',
        name: 'rbac-permission',
        component: () => import('@/views/rbac/permission/index.vue'),
        meta: { title: '权限管理', requiresAuth: true },
      },
      {
        path: 'role',
        name: 'rbac-role',
        component: () => import('@/views/rbac/role/index.vue'),
        meta: { title: '角色管理', requiresAuth: true },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// 登入守卫：受保护路由需凭证；已登入访问登入页则回跳
router.beforeEach((to) => {
  const authed = Boolean(getToken())
  if (to.matched.some((record) => record.meta.requiresAuth) && !authed) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'auth' && authed) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : ''
    return redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard'
  }
})

// 路由切换后同步浏览器标题
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  document.title = title ? `${title} · 云岫` : '云岫工作台'
})

export default router
