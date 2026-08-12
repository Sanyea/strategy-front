# src/composables

组合式函数（Composables）目录，Vue3 逻辑复用的核心方式。

## 什么是 Composable
以 `use` 开头的函数，封装可复用的响应式逻辑，替代 Vue2 的 mixin。

## 存放内容
- `useTable.ts`：表格分页、查询、重置通用逻辑
- `useUpload.ts`：文件上传通用逻辑
- `useDarkMode.ts`：暗黑模式切换
- `usePermission.ts`：权限判断
- `useDebounce.ts`：防抖函数封装

## 编写规范
```typescript
export function useTable(apiFn: Function) {
  const loading = ref(false)
  const dataList = ref([])
  const pagination = reactive({ page: 1, pageSize: 10, total: 0 })

  async function fetchData() { /* ... */ }

  return { loading, dataList, pagination, fetchData }
}
```
- 函数名以 `use` 开头
- 返回响应式状态和操作方法
- 不依赖具体组件，纯逻辑封装
