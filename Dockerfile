# syntax=docker/dockerfile:1
# ============ 构建阶段 ============
# 依赖树（vue-router 5 / vite 8 / babel 8）要求 node >=24.11，alpine 锁大版本保证可复现
FROM node:24.9.0-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL
# 构建时可覆盖后端地址；未传时回落到 .env.production 里的默认值
ARG VITE_UPLOAD_URL

# 先拷锁文件装依赖，走 Docker layer 缓存，源码变更不重装
COPY package.json package-lock.json ./
RUN corepack enable && npm ci

# 拷源码 + 环境变量文件，执行生产构建（vue-tsc 类型检查 + vite build）
COPY . .
# K8s 场景：浏览器同源访问，/api 由 nginx 反代到后端 ClusterIP，见 nginx.conf
# 默认相对路径；仍保留 ARG 覆盖能力，适配非 K8s 部署
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL:-/api} \
    VITE_UPLOAD_URL=${VITE_UPLOAD_URL:-/api/upload}
RUN npm run build

# ============ 运行阶段 ============
FROM nginx:alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# 静态站点无需容器内进程管理，nginx 默认前台运行即可
