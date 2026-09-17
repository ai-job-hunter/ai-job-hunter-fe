# =============================================================================
# AI Job Hunter Frontend - 生产镜像构建
# 多阶段构建：Nuxt build → Nginx 托管
#
# 构建参数：
#   API_BASE  构建时注入，生产前端发同源 /api（由 nginx 反代到后端）
# =============================================================================

# ─── 构建阶段 ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源码
COPY . .

# 构建时注入：生产环境 API_BASE 为空（同源），本地 dev 用 http://localhost:8080
ARG API_BASE=
ENV API_BASE=$API_BASE
ENV NODE_ENV=production

# 构建 Nuxt 静态产物
RUN npm run build

# ─── 运行阶段 ───────────────────────────────────────────────────────────────
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/.output/public /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 健康检查（Alpine 用 BusyBox wget）
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
