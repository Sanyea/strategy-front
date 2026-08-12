# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目状态

商业级前端工程骨架 — 基于 create-vite vue-ts 模板（Vite 8、Vue 3.5、TypeScript），已搭建完整目录结构与工程化配置，尚无业务代码。模板自带的 `HelloWorld.vue` / `App.vue` 为占位内容。

> 注意：各 `src` 子目录当前仅含 README.md 说明，`request.ts`、`DefaultLayout`/`BlankLayout`、styles 下 reset/variables/common 等具体文件尚未实现，为计划中内容。

## 常用命令

- `npm run dev` — 启动 Vite 开发服务器（默认端口 5173）
- `npm run build` — 类型检查 + 生产构建：实际执行 `vue-tsc -b && vite build`，产物输出到 `dist/`
- `npm run preview` — 本地预览生产构建产物
- `npm install` — 安装依赖

当前无 lint/test 脚本（ESLint/Prettier 配置文件已就位，但依赖未安装、脚本未添加）。`npm run build` 是唯一的验证手段。

## 架构

商业级分层目录结构：

- `src/main.ts` — 入口文件，挂载根组件 `App`
- `src/App.vue` — 根组件
- `src/api/` — 接口请求层（request.ts 封装 + modules/ 按业务拆分）
- `src/assets/` — 经 Vite 编译的静态资源（images/icons/fonts）；`public/` 存放原样复制的静态文件
- `src/components/` — 全局通用组件（base/ 纯UI封装 + business/ 通用业务组件）
- `src/composables/` — 组合式函数（useXxx 逻辑复用）
- `src/directives/` — 全局自定义指令
- `src/enums/` — 运行时枚举（含 label 映射）
- `src/layouts/` — 布局组件（DefaultLayout / BlankLayout）
- `src/router/` — 路由配置（index.ts 守卫 + modules/ 按模块拆分）
- `src/stores/` — Pinia 状态管理（modules/ 按模块拆分）
- `src/styles/` — 全局样式体系（reset/variables/common）
- `src/types/` — TypeScript 类型声明（.d.ts）
- `src/utils/` — 纯工具函数（无业务依赖）
- `src/views/` — 业务页面（按模块聚合，模块内 components/ 放独有组件）


每个目录下均有 README.md 说明用途与规范。

关键约定：

- 所有组件使用 Vue 3 `<script setup>` 单文件组件（SFC）
- `vite.config.ts` 保持最小配置（仅 `@vitejs/plugin-vue`）——**未配置 `@` 路径别名**，当前请使用相对路径导入；目录结构已按别名规范组织，配置 `@` → `src/` 后即可直接使用
- TypeScript 使用 project references：`tsconfig.app.json`（应用代码）与 `tsconfig.node.json`（vite 配置），由根 `tsconfig.json` 通过 `vue-tsc -b` 统一引用

## 代码规范（强制约束）

以下为编码时必须遵守的核心约束。

### 组件命名

- 组件文件名一律 **PascalCase**：`UserProfile.vue`、`BaseTable.vue`
- 前缀规范：基础组件 `Base` 前缀（BaseButton），单例组件 `The` 前缀（TheHeader），通用业务组件直接用业务名（UserAvatar）
- 组件名必须由两个及以上单词组成（根组件 `App` 除外），避免与 HTML 原生标签冲突
- 模板中使用 PascalCase + 自闭合：`<UserProfile :user="user" />`

### 文件与目录命名

| 类型 | 风格 | 示例 |
|------|------|------|
| `.vue` 组件 | PascalCase | `UserProfile.vue` |
| `.ts` 工具/组合式函数 | camelCase | `storage.ts`、`useTable.ts` |
| `.d.ts` 类型声明 | camelCase | `user.d.ts`、`api.d.ts` |
| 目录名 | kebab-case | `user-manage/`、`order-center/` |
| 页面文件 | 语义化小写 | `list.vue`、`detail.vue`、`form.vue`、`index.vue` |
| 图片资源 | kebab-case | `user-avatar-default.png` |

### 组件存放位置

按以下决策树判断，禁止放错：

```
多模块复用？
├── 是 + 纯UI无业务 → src/components/base/
├── 是 + 含业务逻辑 → src/components/business/
└── 否（仅单模块用）→ src/views/[模块]/components/
```

- 布局组件放 `src/layouts/`
- 业务页面放 `src/views/[模块]/`
- 禁止把仅单页面使用的组件放到全局 components/

### Vue SFC 内部结构

- 三块顺序固定：`<script setup lang="ts">` → `<template>` → `<style scoped>`
- script 内顺序：import 导入 → defineProps/defineEmits → 响应式变量 → computed → 方法 → 生命周期钩子
- style **必须**加 `scoped`，禁止写全局样式（全局样式放 `src/styles/`）

### 变量、函数、类型命名

- 变量：camelCase；布尔值 `is/has/should/can` 开头（`isDisabled`、`hasPermission`）；常量 UPPER_SNAKE_CASE（`MAX_PAGE_SIZE`）；数组用复数（`users`、`menuList`）
- 函数：动词开头 — `get`（获取）、`set`（设置）、`fetch`（请求接口）、`handle`（事件处理）、`init`（初始化）、`reset`（重置）、`calc`（计算）、`format`（格式化）
- 类型：请求参数 `XxxParams`，响应数据 `XxxResult`，实体 `XxxEntity`；禁止大面积使用 `any`
- 枚举：PascalCase（`UserStatus`），必须配套提供 `XxxLabel` 映射对象用于页面展示

### 导入导出

- 配置 `@` 别名后优先使用绝对路径：`import { getUserList } from '@/api/modules/user'`；当前未配置别名时用相对路径
- 导入顺序分组（组间空行）：Vue 核心 → 第三方库 → 项目内部（@/） → 相对路径 → type-only 导入 → 样式
- 工具函数、枚举用具名导出，便于 tree-shaking；组件用默认导出

### 样式规范

- 组件样式必须加 `scoped`
- 类名使用 BEM 简化版：`.block__element--modifier`（`.user-card__header--active`）
- 禁止：`!important`（覆盖第三方库除外）、ID 选择器、标签选择器、行内样式写复杂逻辑

### 注释规范

- 公共函数必须加 JSDoc 注释（@param、@returns、@example）
- 只注释「为什么这么做」，不注释「做了什么」（代码本身应自解释）
- 复杂业务逻辑、特殊处理、临时方案必须加注释
- TODO/FIXME 注释需说明后续计划

## 工程化配置

- 环境变量：`.env.development` / `.env.production` / `.env.test`，客户端可访问的变量必须以 `VITE_` 开头
- ESLint：`.eslintrc.cjs` 已配置（Vue3 + TS 规则），依赖未安装
- Prettier：`.prettierrc` 已配置（无分号、单引号、100 字符换行、2 空格缩进），依赖未安装
- Git 提交流程（功能分支 → `dev` → `master`）
  - 提交信息：`<type>(<scope>): <subject>`，type 包括 feat/fix/docs/style/refactor/perf/test/chore
  - 保持历史线性：默认快进合并（`git merge`，不产生 merge commit）；仅在明确要求时才用 `--no-ff`
  - **提交与合并的每一步均需人工确认，禁止自动链式执行**：`commit` → 合并到 `dev` → 合并到 `master` → `git push`，每完成一步即停下等待人工确认后再继续

## 其他说明

- 已验证环境：Node 20.19.5、npm 10.8.2
- `.idea/`（WebStorm 配置目录）已被 git 忽略
- `design-tokens-collection.md` — 62 个品牌 design token 合集（colors/typography/rounded/spacing），数据源为 `awesome-design-md-main/`
- `awesome-design-md-main/` — 参考仓库克隆（design token 数据源），非项目代码，勿纳入构建
