# src/stores/modules

按业务模块拆分的 Pinia store 文件。

## 存放内容
- `user.ts`：用户信息、Token、登录登出方法
- `app.ts`：应用全局状态（主题、侧边栏折叠、语言）
- `permission.ts`：权限路由、菜单数据

## 编写规范
```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<UserInfo | null>(null)

  function setToken(val: string) { token.value = val }
  function logout() { token.value = ''; userInfo.value = null }

  return { token, userInfo, setToken, logout }
}, {
  persist: { key: 'user-store', storage: localStorage }
})
```
- 使用 Setup 语法（组合式）而非 Options 语法
- 命名：`useXxxStore`
- 需要持久化的 store 配置 persist
