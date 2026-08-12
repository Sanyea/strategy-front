# src/directives

全局自定义指令目录。

## 存放内容
- `permission.ts`：权限指令 `v-permission`，控制按钮/元素显示
- `copy.ts`：复制指令 `v-copy`，点击复制文本
- `debounce.ts`：防抖指令 `v-debounce`，防止重复点击
- `lazy.ts`：图片懒加载指令 `v-lazy`

## 使用方式
在 `main.ts` 中全局注册：
```typescript
import permission from './directives/permission'
app.directive('permission', permission)
```
模板中使用：`<button v-permission="'user:delete'">删除</button>`
