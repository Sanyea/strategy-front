import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

/** 路由表：工作台首页 + 登入/注册页（BlankLayout 形态，页面自带布局） */
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

// 路由切换后同步浏览器标题
router.afterEach((to) => {
  const title = to.meta?.title as string | undefined
  document.title = title ? `${title} · 云岫` : '云岫工作台'
})

export default router
