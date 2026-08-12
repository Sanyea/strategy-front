# src/stores

Pinia 全局状态管理目录。

## 存放内容
- `index.ts`：Pinia 实例初始化、持久化插件配置
- `modules/`：按业务模块拆分的 store

## 何时使用 Store
- 多个组件共享的数据（用户信息、Token、主题）
- 需要跨页面持久化的状态
- 复杂的全局业务状态

## 何时不使用 Store
- 仅单个组件使用的数据 → 用组件内 ref/reactive
- 父子组件传递 → 用 props/emit
