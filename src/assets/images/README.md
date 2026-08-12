# src/assets/images

项目图片资源目录。

## 存放内容
- 业务页面使用的插图、背景图
- 组件内引用的图片

## 规范
- 优先使用 webp 格式，体积更小
- 图片命名使用 kebab-case：`user-avatar-default.png`
- 超过 200KB 的图片考虑压缩或放到 CDN
- 组件中通过 import 引入：`import bg from '@/assets/images/bg.png'`
