# src/types

TypeScript 全局类型定义目录。

## 存放内容
- `api.d.ts`：接口请求/响应通用类型（分页参数、统一响应结构）
- `user.d.ts`：用户相关业务类型
- `global.d.ts`：全局声明（模块扩展、window 类型、.vue 模块声明）

## 编写规范
- 类型文件使用 `.d.ts` 后缀，编译后不产生 JS
- 接口类型命名：`XxxParams`（请求参数）、`XxxResult`（响应数据）、`XxxEntity`（实体）
- 禁止大面积使用 `any`，类型必须明确
