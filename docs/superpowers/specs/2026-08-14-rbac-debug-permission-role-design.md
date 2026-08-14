---
# RBAC 目录 + debug/permission/role 管理页设计

日期：2026-08-14
状态：已确认

## 目标

将现有 RBAC 四个页面（roles / permissions / role-permissions / user-roles）重构为 RBAC 目录下的三个平级管理页：`debug` / `permission` / `role`。侧边栏菜单树由后端 `myMenuTree` 驱动，并在前端按 `myPermissions` 权限码做**二次过滤**。布局合并为单一认证布局。路由保持静态。

## 范围

- 侧边栏：`myMenuTree` 树结构（不再拍平）→ 嵌套 `NavItem[]`，前端按 `userStore.permissions` 二次过滤
- 布局：`DashboardLayout.vue` + `AdminLayout.vue` 合并为单一认证布局 `DefaultLayout.vue`
- 路由（静态）：`/dashboard`、`/rbac`（目录，redirect `/rbac/debug`）、`/rbac/debug`、`/rbac/permission`、`/rbac/role`
- 页面重写：
  - `debug` → `rbacDebug.ts`（校验/生效权限/踢人/批量踢任务）
  - `permission` → `rbacPermission.ts`（权限树 CRUD + 同步）
  - `role` → `rbacRole.ts` + `rbacRolePermission.ts` + `rbacUserRole.ts`（页内三标签）
- role 页内三标签，按权限码门控显隐
- 删除旧四页面目录（roles / permissions / role-permissions / user-roles）与 `AdminLayout`

## 非目标

- 不新增后端接口（全部消费现有 API 模块）
- 不做动态路由（路由写死静态）
- 不做按钮级 `v-permission` 指令（本轮仅菜单/标签按权限码过滤）
- 不迁移 `views/dashboard`（个人仪表盘内容不动，仅换到统一布局下）

## 权限码全集

| 权限码 | 作用 |
|--------|------|
| `system:rbac:debug:manage` | debug 页 / 菜单项 |
| `system:permission:manage` | permission 页 / 菜单项 |
| `system:role:manage` | role 页 / 菜单项 + 角色管理标签 |
| `system:role:assign` | 角色授权标签 |
| `system:user:role:manage` | 用户角色标签 |

## 架构

```
myMenuTree（全量树）──┐
                      ├─ 二次过滤（permissionCode ⊆ userStore.permissions + isVisible）
myPermissions（码集）──┘            │
                                    ▼
                    嵌套 NavItem[] → AppSidebar 渲染
                                         │
DefaultLayout（合并布局：侧边栏 + 面包屑 + 灵动岛 + RouterView）
   ├── /dashboard        个人仪表盘
   └── /rbac             RBAC 目录（redirect）
         ├── /rbac/debug      debug 管理页
         ├── /rbac/permission permission 管理页
         └── /rbac/role       role 管理页（页内三标签）
```

## 组件与数据流

### 菜单 Store（`src/stores/modules/menu.ts`）

- `state: { tree: MenuNode[] | null, navItems: NavItem[], isLoaded: boolean }`
- `NavItem` 扩展为嵌套：`{ label, icon, to?, children?: NavItem[] }`
- `fetchMenuTree()`：调 `myMenuTree()` 存原始树；`filteredNav` 由二次过滤函数生成，写 `navItems`；成功才置 `isLoaded = true`
- 二次过滤规则（`buildNav(tree, perms)`）：
  1. `permissionCode` 存在且不在 `perms` → 剪掉该节点
  2. `isVisible === 'NO'` → 剪掉
  3. 目录节点子级被剪空 → 该目录一并剪掉
  4. 叶子节点需 `routePath` 非空才保留为链接
  5. `routePath === '/'`（首页根）不纳入导航（回首页仅走登出）
- `$reset()` 时 `tree = null`、`navItems = []`、`isLoaded = false`（登出调用）

### 布局合并（`src/layouts/DefaultLayout.vue`）

- 删除 `AdminLayout.vue`；`DashboardLayout.vue` 重命名为 `DefaultLayout.vue`
- 结构同现 DashboardLayout：`ThemeIsland` + `AppSidebar(:items=menuStore.navItems)` + sticky head（`AppBreadcrumb`）+ `RouterView` + `BaseToastHost`
- `onMounted`：并行 `Promise.all([fetchMenuTree(), fetchPermissions()])`，任一失败 toast 报错

### 侧边栏嵌套渲染（`src/layouts/AppSidebar.vue`）

- `NavItem` 增加可选 `children?: NavItem[]`
- 有 `children` → 渲染为可展开目录项（chevron 收起/展开，高亮当前子路径时自动展开）
- 无 `children` 且有 `to` → router-link 高亮；无 `to` → 占位按钮
- 移动端抽屉同步嵌套渲染

### 路由（`src/router/index.ts`，全部静态）

```ts
{
  path: '/dashboard', component: () => import('@/layouts/DefaultLayout.vue'), meta: { requiresAuth: true },
  children: [{ path: '', name: 'dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '个人仪表盘', requiresAuth: true } }],
},
{
  path: '/rbac', component: () => import('@/layouts/DefaultLayout.vue'), redirect: '/rbac/debug', meta: { requiresAuth: true },
  children: [
    { path: 'debug', name: 'rbac-debug', component: () => import('@/views/rbac/debug/index.vue'), meta: { title: 'Debug 权限排查', requiresAuth: true } },
    { path: 'permission', name: 'rbac-permission', component: () => import('@/views/rbac/permission/index.vue'), meta: { title: '权限管理', requiresAuth: true } },
    { path: 'role', name: 'rbac-role', component: () => import('@/views/rbac/role/index.vue'), meta: { title: '角色管理', requiresAuth: true } },
  ],
},
```

- 移除旧子路由 `roles | permissions | role-permissions | user-roles`
- 守卫不变（`requiresAuth`）；`/rbac` 无权限码用户：菜单不出现，直接 URL 访问由守卫放行但页面无数据（后端 403），本轮不做页面级拦截

### debug 管理页（`src/views/rbac/debug/index.vue`）

消费 `rbacDebug.ts`：

- 用户权限校验：输入用户 → `check(id)` 返回布尔 + `effective(id)` 返回生效权限码列表（实时联表排查）
- 踢单用户：`evictUser(id)` → 确认后执行
- 批量踢：`evictBatch({ mode: 'sync' | 'async' })`；async 模式 `task(taskId)` 轮询进度展示
- 页面形态：卡片分区（校验区 / 踢人区），静态表格 + 表单

### permission 管理页（`src/views/rbac/permission/index.vue`）

消费 `rbacPermission.ts`：

- 权限资源树：`tree(params)` 渲染树表（`PermissionTreeTable` 复用）
- 新增/编辑：`create1(body)` / `update1(id, body)`（复用 `PermissionFormModal`）
- 删除：`delete1(id)`（确认）
- 启停：`updateStatus1(id, body)`
- 手动同步：`sync({ dryRun })` → 展示 `RSyncReport` 差异

### role 管理页（`src/views/rbac/role/index.vue`）

页内三标签（RouterLink 子路由或 v-show 切换，本轮 v-show 切换，URL 不随标签变化）：

| 标签 | 组件 | API | 权限码 |
|------|------|-----|--------|
| 角色管理 | `RoleManage.vue` | `rbacRole.ts` | `system:role:manage` |
| 角色授权 | `RoleGrant.vue` | `rbacRolePermission.ts` | `system:role:assign` |
| 用户角色 | `UserRole.vue` | `rbacUserRole.ts` | `system:user:role:manage` |

- 标签显隐：按 `userStore.permissions` 过滤，无权限码标签不渲染
- 全无权限 → 提示「无权限访问」
- 角色管理：角色分页 `page()`、新增 `create()`、编辑 `update()`、详情 `detail()`、启停 `updateStatus()`、删除 `deleteUsingDelete()`、克隆 `clone()`、导入导出
- 角色授权：角色权限集 `permissions()`、覆盖 `replace1()`、增量 `grant()`、回收 `revoke()`
- 用户角色：到期分页 `expiring()`、批量续期 `renewBatch()`、用户角色列表 `userRoles()`、覆盖 `replace()`、解绑 `unbind()`、单续期 `renew()`、批量授角色 `assignBatch()`

## 错误处理

- 菜单树 / 权限码拉取失败：`DefaultLayout` toast 报错，页面可重试（store 失败置空）
- 标签页接口失败：页内 toast，不阻断其它标签

## 文件清单

新建：
- `src/layouts/DefaultLayout.vue`（由 DashboardLayout 改名扩展）
- `src/views/rbac/debug/index.vue`
- `src/views/rbac/permission/index.vue`
- `src/views/rbac/role/index.vue`
- `src/views/rbac/role/components/RoleManage.vue` / `RoleGrant.vue` / `UserRole.vue`

修改：
- `src/stores/modules/menu.ts`（树 + 二次过滤）
- `src/layouts/AppSidebar.vue`（嵌套渲染）
- `src/router/index.ts`（静态嵌套路由）

删除：
- `src/layouts/AdminLayout.vue`
- `src/views/rbac/roles/`、`permissions/`、`role-permissions/`、`user-roles/`

复用：
- `src/views/rbac/components/`（ConfirmModal、PermissionCheckTree、PermissionFormModal、PermissionTreeTable、RoleFormModal、StatusTag）
- `src/views/rbac/meta.ts`
- `src/api/modules/rbac/*`（生成代码，不手改）
