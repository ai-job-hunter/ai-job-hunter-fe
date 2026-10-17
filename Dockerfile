# =====================================================================
# 阶段一：构建（对齐 cogniforge-web 方案 A）
# =====================================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
# 静态托管没有运行时 Nuxt 配置；API 基址必须在构建时写入产物。
# 空字符串 = 浏览器请求当前域名 /api/v1/*，由本容器 Nginx 转发到后端。
# 不要写成 /api：接口路径已包含 /api/v1，再拼会变成 /api/api/v1。
ARG API_BASE=
ENV API_BASE=$API_BASE
ENV NODE_ENV=production
RUN npm run build

# =====================================================================
# 阶段二：运行（nginx 静态托管）
# =====================================================================
FROM nginx:alpine

# Portainer / nginx 日志用北京时间（compose 不必再写 TZ）
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

COPY --from=builder /app/.output/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Traefik 通过 HTTP 代理，无需 TLS
# 健康检查放在 docker-compose.yml（与 cogniforge-web 一致），勿写 3000
CMD ["nginx", "-g", "daemon off;"]
