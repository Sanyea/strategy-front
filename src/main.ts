import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/index.css'
import App from './App.vue'
import router from './router'
import { applyWallpaper } from './utils/wallpaper'

// 挂载前随机一张水墨壁纸，写入 CSS 变量供全局 body 背景消费
applyWallpaper()

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
