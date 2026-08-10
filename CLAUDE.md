# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目状态

全新脚手架项目 — 刚由官方 `create-vite` 的 `vue-ts` 模板生成（Vite 8、Vue 3.5、TypeScript）。目前没有任何业务逻辑、路由、状态管理、lint 或测试。模板自带的 `HelloWorld.vue` / `App.vue` 演示代码为占位内容。

## 常用命令

- `npm run dev` — 启动 Vite 开发服务器（默认端口 5173）
- `npm run build` — 类型检查 + 生产构建：实际执行 `vue-tsc -b && vite build`，产物输出到 `dist/`
- `npm run preview` — 本地预览生产构建产物
- `npm install` — 安装依赖

当前没有 lint 或 test 脚本。`npm run build` 是唯一的验证手段。

## 架构

标准的 Vite SFC 布局：

- `src/main.ts` — 入口文件，挂载根组件 `App`
- `src/App.vue` — 根组件
- `src/components/` — 可复用组件
- `src/assets/` — 静态资源（图片、svg）；`public/` 存放直接以根路径访问的静态文件
- `src/style.css` — 全局样式，在 `main.ts` 中引入

关键约定：

- 所有组件使用 Vue 3 `<script setup>` 单文件组件（SFC）
- `vite.config.ts` 保持最小配置（仅 `@vitejs/plugin-vue`）——**未配置 `@` 路径别名**，请使用相对路径导入
- TypeScript 使用 project references：`tsconfig.app.json`（应用代码）与 `tsconfig.node.json`（vite 配置），由根 `tsconfig.json` 通过 `vue-tsc -b` 统一引用

## 其他说明

- 已验证环境：Node 20.19.5、npm 10.8.2
- `.idea/`（WebStorm 配置目录）已被 git 忽略
