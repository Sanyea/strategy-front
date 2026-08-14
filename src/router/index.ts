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
    component: () => import('@/layouts/DashboardLayout.vue'),
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
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/rbac/roles',
    meta: { title: '权限管理' },
    children: [
      {
        path: 'roles',
        name: 'rbac-roles',
        component: () => import('@/views/rbac/roles/index.vue'),
        meta: { title: '角色管理' },
      },
      {
        path: 'permissions',
        name: 'rbac-permissions',
        component: () => import('@/views/rbac/permissions/index.vue'),
        meta: { title: '权限管理' },
      },
      {
        path: 'role-permissions',
        name: 'rbac-role-permissions',
        component: () => import('@/views/rbac/role-permissions/index.vue'),
        meta: { title: '角色授权' },
      },
      {
        path: 'user-roles',
        name: 'rbac-user-roles',
        component: () => import('@/views/rbac/user-roles/index.vue'),
        meta: { title: '用户角色' },
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
    return redirect.startsWith('/') ? redirect : '/dashboard'
  }
})

// 路由切换后同步浏览器标题
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  document.title = title ? `${title} · 云岫` : '云岫工作台'
})

export default router
