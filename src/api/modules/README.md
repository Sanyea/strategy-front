# src/api/modules

按业务模块拆分的接口文件，每个文件对应一个业务域。

## 文件命名
- `user.ts`：用户相关接口（登录、注册、用户信息）
- `system.ts`：系统管理接口（菜单、角色、权限）
- `xxx.ts`：其他业务模块

## 编写规范
```typescript
import request from '../request'

// 获取用户列表
export function getUserList(params: UserListParams) {
  return request.get<UserListResult>('/user/list', { params })
}
```
- 函数命名：动词 + 业务名，如 `getUserList`、`createUser`
- 每个函数必须标注请求参数和返回值类型
