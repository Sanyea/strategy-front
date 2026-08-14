# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目状态

商业级前端工程骨架 — 基于 create-vite vue-ts 模板（Vite 8、Vue 3.5、TypeScript），已搭建完整目录结构与工程化配置。已落地：水墨首页（`/`）与登入/注册页（`/login`）。

已就位的接口工具链（后端 Spring Boot + SpringDoc OpenAPI）：

- `@umijs/openapi` 代码生成：`npm run api:gen` 从 `http://localhost:8080/v3/api-docs` 生成 TS 接口代码到根目录临时目录 `.api-gen/`（已 gitignore），再手动移动到 `src/api/modules/<模块>/`。当前后端暴露两大模块：**auth**（register/login/mfa/refresh/logout，JWT 双 Token + 设备绑定）与 **rbac**（debug/permission/role 三个平级管理页，挂 RBAC 目录下；侧边栏按 `myMenuTree` 渲染并前端二次过滤，见下方说明）
- `src/api/modules/` 结构（生成代码，勿手改业务逻辑）：
  - `request.ts` — axios 请求封装：baseURL 读 `VITE_API_BASE_URL`、Bearer 注入、业务码校验（信封 `code === 200` 成功，HTTP 200 但 code 非 200 抛 `ApiError`）、401 静默刷新重试、设备 ID 持久化
  - `typings.d.ts` — 全模块共享 `namespace API` 类型声明（auth + rbac 合并，模块级共用，勿拆回各模块）
  - `auth/`、`rbac/` — 按模块接口文件；`index.ts` 为聚合 barrel（默认导出 `{ auth, rbacRole, rbacPermission, ... }`）
  - **手动移动后必须修正跨模块导入**：生成器会写成 `../.api-gen/...`，移到 `src/api/modules/` 后须改为 `./auth/auth.ts` 等相对路径，勿依赖 gitignored 的 `.api-gen`
- 开发代理：`vite.config.ts` 中 `/api` → `http://localhost:8080`（去掉 `/api` 前缀，后端接口位于根路径）

> 注意：路由已拆为「基础公共静态路由 + 动态路由」：`src/router/index.ts` 仅保留首页 `/`、登入注册 `/login`；`/dashboard` 与 `/rbac/*` 等受保护路由由路由守卫登录后拉 `myMenuTree` 经 `src/router/dynamic.ts` 动态 `addRoute`（顶层锚 `DefaultLayout`，深层目录拍平，`componentPath` 经 `import.meta.glob('/src/views/**/*.vue')` 解析）。**404 兜底必须等动态路由全部 addRoute 完成之后再注册**，否则会拦截动态路由；登出时 `uninstallDynamicRoutes` 清理旧账号路由防跨账号残留。`DefaultLayout` 单一认证布局（侧边栏后端菜单树 + 二次权限过滤 + 面包屑 + 灵动岛）；`BlankLayout` 尚未实现，为计划中内容。styles 体系已就位（见「水墨设计系统」）。`src/api/` 下为生成代码，勿手改业务逻辑。

## 水墨设计系统

全站采用极简新中式水墨风，四套专属色系，CSS 变量驱动，零新增依赖（纯 CSS）。

- 文件：色值 token 在 `src/styles/variables.css`；入口 `src/styles/index.css`（variables → reset → common）
- 语义色值命名，跨组件统一消费，禁止在组件里直接写十六进制色值：
  - 底色：`--color-bg` 宣纸 / `--color-bg-soft` 卡片
  - 文字：`--color-ink` 标题强调 / `--color-text` 正文 / `--color-text-secondary` 次级 / `--color-text-weak` 弱化占位
  - 边框：`--color-border` / `--color-border-soft` 弱化分割线
  - 主色：`--color-primary` 主按钮导航 / `--color-on-primary` 主色上文字 / `--color-primary-soft` 主色淡底
  - 点缀：`--color-accent`（朱砂）/ `--color-accent-blue`（青蓝）/ `--color-accent-green`（石绿）/ `--color-accent-soft`
  - 水墨晕染：`--wash-mist` / `--wash-mist-2`（body 背景远山雾霭，透明度渐变）
- 16:9 水墨壁纸随机背景：`src/utils/wallpaper.ts`（`applyWallpaper` 挂载前随机一张，与宣纸纱罩整体写入 `--wash-wallpaper-bg`，同一会话内保持稳定，避免页面切换闪烁）
  - 图片来源 `public/washpaintingstyle/16-9/{animal,city,scenery}/`，三分类共 54 张；新增/删除图片需同步 `CATEGORIES` 计数表
  - 图片资源**不入 git**（`.gitignore` 排除 `public/washpaintingstyle/`），部署时随 `public/` 目录提供；克隆仓库后需自行补充壁纸目录
  - 全局消费：`body` 背景 `background-image: var(--wash-wallpaper-bg)`（`src/styles/reset.css`），所有页面自动生效；`:root` 兜底默认值在 `src/styles/variables.css`。**勿用 `url(var(...))` 形式**，会被构建期 CSS 压缩器（lightningcss）拒绝
- 主题切换：`<html data-theme="mono|mist|tea|wash">`，缺省即方案一（`:root` 兜底）
  - `mono` 经典墨韵黑白（默认）/ `mist` 青灰烟雨 / `tea` 茶褐古雅 / `wash` 淡彩水墨（基底同 mono + 三色点缀）
- 硬性规则（设计稿强制，页面开发必须遵守）：
  - 禁止纯白 `#FFF` / 纯黑 `#000`，底色一律用宣纸 token
  - 水墨晕染靠 opacity / 透明度渐变实现，无生硬实色块、无厚重色块堆积
  - 彩色（accent 系）仅小面积点缀（徽标 / 关键词 / 装饰线），不用于大面积背景与主色调
- 全局 UI 原语类在 `src/styles/common.css`：`.btn--primary/--secondary/--ghost/--accent`、`.card`、`.badge/.tag`、`.input`、`.nav`、`.divider`、`.text--*`；组件内样式仍用 `<style scoped>` 消费 token
- 落地首页：`src/views/home/index.vue`（模块：首屏/信任条/功能/评价/价格/FAQ/行动按钮/页脚）；默认方案一 `mono`
  - 顶部悬浮主题切换灵动岛（`ThemeIsland`，滚动收缩 + 悬停展开）
  - 左上角登录书签控件：半矩形 + 底部三角裁切（`clip-path`），纯图标无文字，底色固定点缀色朱砂 `#a85448` 不随主题变化；已接入 `/login` 登入/注册页
- 登入/注册页：`src/views/auth/index.vue`（路由 `/login`；单卡片 + 顶部登入/注册开关，事件链切换模式；背景走全局随机壁纸）
  - `components/AuthMethodSelect.vue` — 流程**第一步**的整屏方式选择器（竖排卡片，可用项可点，未开放项虚框置灰「暂未开放」），登入/注册共用
  - `components/LoginCard.vue` — 两步：① 选方式（当前仅「账号密码」开放）→ ② 账号密码表单（顶部「选择其它方式」可返回）；命中 MFA（HTTP 403 挑战）原地切换 6 位 TOTP 二次验证
  - `components/RegisterCard.vue` — 印章步骤条四步：方式 → 账号 → 资料 → 完成；**仅后端信封 `code === 200` 返回后才进入完成步**（已立 + 双 Token 自动登入）；注册完成带账号回登入预填
  - 支撑工具：`src/utils/device.ts`（buildDeviceInfo / detectChannel 渠道识别）、`src/utils/error.ts`（ApiError + readApiErrorMessage 提取后端 message）
- 主题切换灵动岛：`src/components/business/ThemeIsland.vue`（悬浮吸顶毛玻璃，滚动后收缩为半透明胶囊，鼠标移入/键盘聚焦展开；写 `<html data-theme>` + localStorage）
- 侧边栏导航：`src/layouts/AppSidebar.vue`（左侧固定 + 毛玻璃，滚动后自动收缩为图标栏、回顶/鼠标移入展开，移动端 off-canvas 抽屉 + 汉堡触发；`items` 走 `NavItem[]` prop，支持嵌套目录渲染——`AppSidebarNav.vue` 递归组件，叶子路由项渲染为 router-link，由后端 `myMenuTree` 二次过滤后驱动）

## 常用命令

- `npm run dev` — 启动 Vite 开发服务器（默认端口 5173）
- `npm run build` — 类型检查 + 生产构建：实际执行 `vue-tsc -b && vite build`，产物输出到 `dist/`
- `npm run preview` — 本地预览生产构建产物
- `npm run api:gen` — 从后端 OpenAPI spec 生成接口代码（`@umijs/openapi`，产物到 `src/api/`）
- `npm install` — 安装依赖

当前无 lint/test 脚本（ESLint/Prettier 配置文件已就位，但依赖未安装、脚本未添加）。`npm run build` 是唯一的验证手段。

## 架构

商业级分层目录结构，每层有明确的存放规则与约束：

### `src/api/` — 接口请求层

所有后端 API 统一管理，禁止组件中直接调用 axios。

- `request.ts`：Axios 实例封装（请求/响应拦截器、Token 注入、统一错误处理、超时配置）
- `modules/`：按业务模块拆分的接口文件（`user.ts`、`system.ts` 等）
- 每个接口函数必须定义完整的 TypeScript 类型（请求参数、响应数据）
- 后端接口变更只修改本层，不影响业务组件

### `src/api/modules/` — 按业务模块拆分

```typescript
import request from '../request'
// 获取用户列表
export function getUserList(params: UserListParams) {
  return request.get<UserListResult>('/user/list', { params })
}
```

- 函数命名：动词 + 业务名，如 `getUserList`、`createUser`
- 每个函数必须标注请求参数和返回值类型

### `src/assets/` — 经 Vite 编译的静态资源

| 特性 | src/assets | public |
|------|-----------|--------|
| Vite 处理 | 编译、压缩、hash 重命名 | 原样复制 |
| 引用方式 | `import logo from './logo.png'` | `/logo.png` |
| 适用场景 | 组件内使用的小资源 | 不需编译的大文件 |

- `images/`：图片资源，优先 webp 格式，kebab-case 命名，超 200KB 考虑压缩或 CDN
- `icons/`：SVG 图标，kebab-case 命名，可配合 `vite-plugin-svg-icons` 实现雪碧图
- `fonts/`：字体文件，优先 woff2，兼容性不足时补充 ttf，通过 `@font-face` 声明

### `src/components/` — 全局通用组件

多模块都会用到的组件放这里，仅单页面使用的组件禁止放入。

- `base/`：基础 UI 组件层（对第三方 UI 库的二次封装，与业务完全解耦）
  - `BaseTable`（分页/查询/列配置）、`BaseButton`（权限控制/防抖）、`BaseDialog`（统一标题/底部按钮）、`BaseForm`（表单校验/提交流程）
  - 保持与原 UI 库 API 兼容，通过 props 扩展能力，便于后续换 UI 库
- `business/`：通用业务组件层（多个页面复用的业务组件）
  - `UserAvatar`（头像+在线状态）、`UploadFile`（文件上传）、`DictSelect`（字典下拉）、`ImagePreview`（图片预览）
  - 必须通过 props 接收数据，不直接耦合具体页面接口，复杂逻辑抽离到 composables

### 组件归属决策树

```
多模块复用？
├── 是 + 纯UI无业务 → src/components/base/
├── 是 + 含业务逻辑 → src/components/business/
└── 否（仅单模块用）→ src/views/[模块]/components/
```

### `src/composables/` — 组合式函数

以 `use` 开头的函数，封装可复用的响应式逻辑：

- `useTable.ts`（表格分页/查询/重置）、`useUpload.ts`（文件上传）、`useDarkMode.ts`（暗黑模式）、`usePermission.ts`（权限判断）、`useDebounce.ts`（防抖封装）
- 返回响应式状态和操作方法，不依赖具体组件，纯逻辑封装

### `src/directives/` — 全局自定义指令

在 `main.ts` 中全局注册，模板中使用：

- `v-permission`（权限控制）、`v-copy`（点击复制）、`v-debounce`（防抖点击）、`v-lazy`（图片懒加载）

### `src/enums/` — 运行时枚举

与 `types` 的区别：enums 编译后保留为 JS 对象，types 编译后完全消失。

```typescript
export enum UserStatus { DISABLED = 0, ENABLED = 1 }
export const UserStatusLabel: Record<UserStatus, string> = {
  [UserStatus.DISABLED]: '禁用', [UserStatus.ENABLED]: '启用'
}
```

- 枚举值使用数字或字符串常量，配套提供 label 映射对象用于页面展示

### `src/layouts/` — 布局组件

只负责结构框架，不包含业务逻辑，通过 `<router-view />` 渲染子页面。

- `DefaultLayout.vue`：单一认证布局（侧边栏后端菜单树 + 二次权限过滤 + 面包屑 + 灵动岛 + 内容区），`/dashboard` 与 `/rbac/*` 共用
- `BlankLayout.vue`：空白布局（登录页、全屏页使用，尚未实现）

### `src/router/` — 路由配置

- `index.ts`：路由实例创建、基础公共静态路由（首页 / 登入注册）、全局守卫（动态路由按需装载 + 登入校验 + 标题同步）
- `dynamic.ts`：由 `myMenuTree` 菜单树构建动态路由并 `addRoute`（顶层锚 `DefaultLayout`，叶子懒加载 `componentPath`，404 兜底最后注册）；登出 `uninstallDynamicRoutes` 清理
- 路由组件使用懒加载 `() => import(...)`，meta 中配置标题、requiresAuth
- 核心职责：路由表定义、未登录跳转、权限守卫、动态路由

### `src/stores/` — Pinia 全局状态管理

- 何时使用：多组件共享数据（用户信息/Token/主题）、跨页面持久化、复杂全局业务状态
- 何时不用：单组件数据用 ref/reactive，父子传递用 props/emit
- 使用 Setup 语法（组合式），命名 `useXxxStore`，持久化 store 配置 persist

### `src/stores/modules/`

- `user.ts`（用户信息/Token/登入登出）、`app.ts`（主题/侧边栏/语言）、`permission.ts`（权限路由/菜单）

### `src/styles/` — 全局样式体系

- `reset.css`：浏览器默认样式重置、`variables.css`：CSS 全局变量（主题色/间距/字号/圆角）、`common.css`：通用工具类、`transition.css`：页面过渡动画
- 组件内用 `<style scoped>`，全局样式只放真正全局生效的内容
- 主题色、间距通过 CSS 变量统一管理，便于换肤

### `src/types/` — TypeScript 类型声明

- `.d.ts` 后缀，编译后不产生 JS。`api.d.ts`（接口通用类型）、`user.d.ts`（用户类型）、`global.d.ts`（全局声明）
- 命名：`XxxParams`（请求参数）、`XxxResult`（响应数据）、`XxxEntity`（实体），禁止大面积使用 `any`

### `src/utils/` — 纯工具函数

- `storage.ts`（localStorage 封装+过期时间）、`date.ts`（日期格式化）、`validate.ts`（表单校验）、`auth.ts`（Token 存取）、`download.ts`（文件下载）
- 纯函数，不依赖 Vue 实例、不依赖业务代码，输入明确、输出可预测

### `src/views/` — 业务页面

按业务模块聚合，每个模块独立文件夹：

```
views/
├── login/          # 登录模块
├── dashboard/      # 仪表盘
└── user/           # 用户管理
    ├── components/ # 该模块独有的业务组件
    ├── list.vue    # 用户列表页
    └── detail.vue  # 用户详情页
```

- 页面组件只负责渲染和交互，复杂逻辑抽离到 composables
- 接口调用通过 `src/api/` 层，不直接写 axios
- 模块独有的组件放在模块内 `components/`，不放全局
- 页面文件命名：列表页 `list.vue`，详情页 `detail.vue`，表单页 `form.vue`

关键约定：

- 所有组件使用 Vue 3 `<script setup>` 单文件组件（SFC）
- `@` 路径别名已配置（`vite.config.ts` resolve.alias + `tsconfig.app.json` paths），统一用绝对路径导入：`@/api/modules/request`、`@/api/xxx`
- `vite.config.ts` 含开发代理（`/api` → `http://localhost:8080`），修改需谨慎
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

- 已配置 `@` 别名，优先使用绝对路径：`import { getUserList } from '@/api/modules/user'`
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
- API 代码生成：`openapi2ts.config.ts` 配置 `@umijs/openapi`（schemaPath/serversPath/projectName/requestLibPath）。后端接口变更后跑 `npm run api:gen`，产物在 `.api-gen/api/`，手动移动到 `src/api/modules/<模块>/`；生成器会清空输出目录，勿直接输出到 `src/api/`，勿手改生成产物
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
