# src/enums

全局枚举目录，运行时真实存在的常量集合。

## 与 types 的区别
| 特性 | enums | types |
|------|-------|-------|
| 编译后 | 保留为 JS 对象 | 完全消失 |
| 用途 | 固定可选值的映射 | 类型约束、接口定义 |
| 示例 | 用户状态 0=禁用 1=启用 | User 接口类型 |

## 存放内容
- `user.ts`：用户状态、性别、角色枚举
- `common.ts`：通用状态、是否枚举
- `http.ts`：HTTP 状态码、请求方法枚举

## 编写规范
```typescript
export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1
}

export const UserStatusLabel: Record<UserStatus, string> = {
  [UserStatus.DISABLED]: '禁用',
  [UserStatus.ENABLED]: '启用'
}
```
- 枚举值使用数字或字符串常量
- 配套提供 label 映射对象，用于页面展示
