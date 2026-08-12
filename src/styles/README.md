# src/styles

全局样式体系目录。

## 存放内容
- `reset.css`：浏览器默认样式重置（normalize）
- `variables.css`：CSS 全局变量（主题色、间距、字号、圆角）
- `common.css`：通用工具类（flex 居中、文本省略、滚动条样式）
- `transition.css`：页面过渡动画

## 规范
- 组件内样式使用 `<style scoped>`，避免污染全局
- 全局样式只放真正全局生效的内容
- 主题色、间距等通过 CSS 变量统一管理，便于换肤
