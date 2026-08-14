# 个人仪表盘页设计

日期：2026-08-14
状态：已确认

## 目标

登入后展示的个人仪表盘页（`/dashboard`），含左侧边栏。登入成功跳转该页；未登入访问重定向登入页。侧边栏菜单树由后端 `myMenuTree` 接口驱动；用户信息与权限码存入 Pinia。

## 范围

- 新路由 `/dashboard` + 登入守卫
- 登入成功跳转改为 `/dashboard`（支持 `?redirect=` 回跳）
- 侧边栏按 `myMenuTree` 渲染
- 欢迎横幅 + 静态统计看板 + 占位区块
- Pinia 存储用户信息 / 权限码 / 菜单树
- 登出

## 非目标

- 不新增后端仪表盘接口（统计数字全静态占位）
- 不改 `AdminLayout`（仍用静态 navItems，本轮不扩范围）
- 不做路由级按钮权限控制（仅登入守卫）

## 架构

```
main.ts 注册 createPinia
  └── stores/modules/user.ts  用户信息 + 权限码
  └── stores/modules/menu.ts  菜单树 → NavItem[]
router.beforeEach 守卫（requiresAuth）
DashboardLayout 复用 AppSidebar，onMounted 拉菜单树
views/dashboard/index.vue  欢迎横幅 + 统计 + 占位
```

## 组件与数据流

### 路由与守卫

`src/router/index.ts`：

```ts
{
  path: '/dashboard',
  component: () => import('@/layouts/DashboardLayout.vue'),
  meta: { requiresAuth: true },
  children: [
    {
      path: '',
      name: 'dashboard',
      component: () => import('@/views/dashboard/index.vue'),
      meta: { title: '个人仪表盘', requiresAuth: true },
    },
  ],
}
```

`router.beforeEach`：

- `to.matched.some(r => r.meta.requiresAuth)` 且无 `getToken()` → `router.replace({ path: '/login', query: { redirect: to.fullPath } })`
- `to.path === '/login'` 且已登入 → 跳 `query.redirect` 或 `/dashboard`（避免登入态再进登入页）

### Pinia 存储

`main.ts`：`app.use(createPinia())`（在 `use(router)` 前）。不建 `stores/index.ts` barrel，store 各自在 `modules/` 导出。

`src/stores/modules/user.ts`（`useUserStore`）：

- `state: { user: StoredUser | null, permissions: string[] }`
- `StoredUser = { username: string; nickname: string; phone?: string; email?: string }`
- `setUser(user)`：写 state，并委托 `account.setStoredUser` 写 localStorage
- 初始化：`getStoredUser()` 读 localStorage 补水合（避免刷新丢失）
- `fetchPermissions()`：调 `myPermissions()`，结果写 `permissions`
- `clear()`：清 state + 委托 `account.clearStoredUser`

`src/stores/modules/menu.ts`（`useMenuStore`）：

- `state: { navItems: NavItem[] }`
- `fetchMenuTree()`：调 `myMenuTree()`，拍平树 → `NavItem[]`，失败置空数组 + 抛错给调用方 toast

拍平规则：遍历树（含子节点），取 `isVisible === 'YES'`（缺省视为可见）且 `routePath` 非空的节点；label = `permissionName`；icon 走映射，未知回落 `menu` 图标。DIRECTORY / MENU 均可能带 `routePath`，统一拍平为链路项（AppSidebar 为扁平列表，不支持分组）。

### 欢迎身份存取

`src/utils/account.ts`：

- `getStoredUser(): StoredUser | null`
- `setStoredUser(user: StoredUser): void`
- `clearStoredUser(): void`

key 统一 `strategy-front-user`。仅 user store 消费。

### 登入 / 注册接入

`LoginCard.vue` `submitLogin` / `submitMfa` 成功：`setToken(res.data)` 后调 `useUserStore().setUser({ username: account.trim(), nickname: account.trim() })`（登入态无真实昵称，回落账号）。

`RegisterCard.vue` 注册成功：`setUser({ username, nickname: nickname || username, phone, email })`。

### 侧边栏布局

`src/layouts/DashboardLayout.vue`：

- 复用 `AppSidebar` + 右侧内容区（骨架同 `AdminLayout`：head 标题 + `RouterView`）
- `onMounted`：`useMenuStore().fetchMenuTree()`；失败 `BaseToastHost` 报错
- `navItems = computed(() => menuStore.navItems)`
- 页面标题取 `route.meta.title`

`AppSidebar.vue`：`ICONS` 增加 `menu`（通用菜单）、`logout`（登出）图标，供菜单树映射与欢迎横幅用。

### 仪表盘页面

`src/views/dashboard/index.vue`：

- `onMounted`：`fetchPermissions()`（权限入 Pinia；页面不直接消费，供后续守卫）
- 欢迎横幅卡片：
  - `欢迎，{{ nickname }}`（读 `userStore.user`）
  - 次行：账号 `@username` · 当前日期
  - 登出按钮：`logout()` API → 无论成败 `clear()` + `router.replace('/login')`
- 数据统计看板：4 张静态卡片（可访问菜单 12 / 我的权限码 48 / 系统角色 6 / 角色绑定 32），标注静态占位
- 占位区块：最近动态、待办事项（静态演示列表，标注「演示占位」）
- 全水墨 token（`--color-*` / `--space-*`），无十六进制，`<style scoped>`

## 错误处理

- `myMenuTree` 拉取失败：菜单树为空，toast 提示「菜单加载失败」；不影响页面主体
- `myPermissions` 拉取失败：`permissions` 留空，静默（仅 warn），不阻塞页面
- 登出 API 失败：仍清本地凭证并跳 `/login`（本地退出优先）

## 验证

无 lint/test 脚本，`npm run build`（`vue-tsc -b && vite build`）为唯一验证手段。手动核对：

1. 未登入访问 `/dashboard` → 跳 `/login`
2. 登入成功 → 跳 `/dashboard`，欢迎横幅显示账号
3. 侧边栏渲染 `myMenuTree` 菜单
4. 统计卡片 / 占位区块渲染正常
5. 登出 → 清凭证回 `/login`

## 涉及文件

改：

- `src/main.ts`（Pinia）
- `src/router/index.ts`（路由 + 守卫）
- `src/views/auth/index.vue`（登入成功跳 `/dashboard`，支持 redirect）
- `src/views/auth/components/LoginCard.vue`（成功存用户）
- `src/views/auth/components/RegisterCard.vue`（成功存用户）
- `src/layouts/AppSidebar.vue`（补图标）

新：

- `src/stores/modules/user.ts`
- `src/stores/modules/menu.ts`
- `src/utils/account.ts`
- `src/layouts/DashboardLayout.vue`
- `src/views/dashboard/index.vue`
