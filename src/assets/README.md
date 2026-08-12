# src/assets

经过 Vite 编译处理的静态资源目录。

## 与 public 的区别
| 特性 | src/assets | public |
|------|-----------|--------|
| Vite 处理 | 编译、压缩、hash 重命名 | 原样复制 |
| 引用方式 | `import logo from './logo.png'` | `/logo.png` |
| 适用场景 | 组件内使用的小资源 | 不需编译的大文件 |

## 子目录
- `images/`：图片资源（png、jpg、webp）
- `icons/`：SVG 图标
- `fonts/`：字体文件（woff2、ttf）
