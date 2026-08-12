# src/components/base

基础 UI 组件层，对第三方 UI 库（如 Element Plus）的二次封装。

## 存放内容
- `BaseTable.vue`：封装分页、查询、列配置的通用表格
- `BaseButton.vue`：封装权限控制、防抖的按钮
- `BaseDialog.vue`：封装统一标题、底部按钮的弹窗
- `BaseForm.vue`：封装表单校验、提交逻辑的表单

## 设计原则
- 与业务完全解耦，只做 UI 能力增强
- 保持与原 UI 库 API 兼容，通过 props 扩展能力
- 全项目统一使用基础组件，便于后续换 UI 库时只改这一层
