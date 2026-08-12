# src/assets/fonts

字体文件目录。

## 存放内容
- 自定义字体文件（woff2 优先，ttf 兜底）
- 图标字体文件（如 iconfont）

## 规范
- 优先使用 woff2 格式，兼容性不足时补充 ttf
- 在 `src/styles/` 中通过 `@font-face` 声明字体
