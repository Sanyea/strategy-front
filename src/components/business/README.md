# src/components/business

通用业务组件层，多个业务页面都会复用的业务组件。

## 存放内容
- `UserAvatar.vue`：用户头像展示（含默认头像、在线状态）
- `UploadFile.vue`：文件上传组件（对接后端上传接口）
- `DictSelect.vue`：字典下拉选择器
- `ImagePreview.vue`：图片预览组件

## 规范
- 组件必须通过 props 接收数据，不直接耦合具体页面的接口
- 复杂业务逻辑抽离到 composables
