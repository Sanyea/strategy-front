# public

纯静态资源目录，文件**不经过 Vite 编译处理**，原样复制到构建产物根目录。

## 存放内容
- `favicon.ico`：网站图标
- 不需要编译的大体积静态文件（PDF、视频等）
- 第三方库的静态资源（如 tinymce 的 skins）

## 使用规范
- 引用路径直接写根路径：`/favicon.ico`
- 需要被 Vite 压缩、hash 重命名的资源请放在 `src/assets/`
- 不要在此目录写需要 import 引入的文件
