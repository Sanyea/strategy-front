# src/router/modules

按业务模块拆分的路由配置文件。

## 文件命名
- `user.ts`：用户管理模块路由
- `system.ts`：系统管理模块路由
- `dashboard.ts`：仪表盘路由

## 编写规范
```typescript
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/user',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        path: 'list',
        name: 'UserList',
        component: () => import('@/views/user/list.vue'),
        meta: { title: '用户列表', icon: 'user', roles: ['admin'] }
      }
    ]
  }
]

export default routes
```
- 路由组件使用懒加载：`() => import(...)`
- meta 中配置标题、图标、权限角色、是否缓存等
