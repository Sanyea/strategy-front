import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { applyWallpaper } from './utils/wallpaper'
import { SESSION_EXPIRED_EVENT } from '@/api/modules/request'
import { uninstallDynamicRoutes } from '@/router/dynamic'
import { useMenuStore } from '@/stores/modules/menu'
import { useUserStore } from '@/stores/modules/user'
import { useToast } from '@/composables/useToast'
import './styles/index.css'

// 挂载前随机一张水墨壁纸，写入 CSS 变量供全局 body 背景消费
applyWallpaper()

const app = createApp(App)
app.use(createPinia())
app.use(router)

// 会话失效（401 刷新失败）：清用户态 + 卸动态路由 + 提示 + 回登入页。
// 事件由 request 层在刷新失败清凭证后广播，此处集中收尾，避免 request ↔ store/router 循环依赖
window.addEventListener(SESSION_EXPIRED_EVENT, (event) => {
  const detail = (event as CustomEvent<{ message?: string }>).detail
  const message = detail?.message || '会话已失效，请重新登录'
  useUserStore().clear()
  useMenuStore().$reset()
  uninstallDynamicRoutes(router)
  useToast().error(message)
  if (router.currentRoute.value.name !== 'auth') {
    void router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
  }
})

app.mount('#app')
