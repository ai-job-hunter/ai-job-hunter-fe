# AI Job Hunter

> AI 求职助手（V1：手动粘贴 + AI 分析/话术；BOSS 自动操作延后 V2）

## [变更记录]
| 日期 | 版本 | 变更摘要 | 负责人 |
|---|---|---|-----|
| 2026-11-26 | v1.1 | 升级 Nuxt 3 → 4.7；CI Node 22；`package.json` 声明 `type: module` | orjrs |
| 2026-11-23 | v1.0 | V1 说明书与范围说明 | orjrs |

## [变更] Nuxt 4 升级（2026-11-26）

- **变更原因**：Nuxt 3 进入维护末期；对齐官方 Node 22+ 与 Nuxt 4 默认行为。
- **包含代码**：`package.json` / lockfile、`nuxt.config.ts` `compatibilityDate`、CI `node-version: 22`。
- **不变**：页面功能与顶层目录结构（未强制迁入 `app/`）；`ssr: false` + `npm run generate` 静态托管。

## 项目简介

AI Job Hunter 帮你把求职材料管起来，并用 AI 分析简历、拆解 JD、写打招呼/回复、跟投递进度。  
**当前 V1 不做** 自动登录 BOSS、自动搜岗、自动发消息；岗位 JD 与聊天内容由你自己粘贴进来。

**已可用：**

- 📄 **简历**：上传 txt / PDF / Word，抽文本后 AI 分析与优化建议
- 💼 **岗位**：粘贴 JD → 分析、匹配度、打招呼话术（可优先用默认模板）
- 💬 **沟通**：手动建对话、粘贴消息 → AI 推荐回复
- 📤 **投递**：标记已投递 + 看板改状态
- 📊 **统计**：今日/趋势/漏斗 + 周报
- ⚙️ **设置**：打招呼模板、黑名单（建岗时拦截）

**尚未做（V2+）：** BOSS 连接与爬取、全自动/半自动模式、多平台。

## 技术架构

```
浏览器 → Nuxt 4 SPA → Spring Boot API → PostgreSQL / Redis
                         ↓
                   DeepSeek（Spring AI）
```

### 技术栈

| 模块 | 技术 | 说明 |
|-----|------|------|
| 前端 | Vue 3 + Nuxt 4 | SPA（`ssr: false`）；目录仍用 Nuxt 3 顶层布局（自动兼容） |
| 后端 | Spring Boot 4 + JDK 21 | 业务 API + Agent |
| 数据库 | PostgreSQL 18 | 业务数据 |
| 缓存 | Redis | 缓存等 |
| AI | DeepSeek（Spring AI） | 分析 / 话术 |

## 项目结构

```
ai-job-hunter/
├── ai-job-hunter-be/          # Java 后端 (Spring Boot)
├── ai-job-hunter-fe/          # Nuxt 4 前端 (Vue 3)
├── ai-job-hunter-agent/        # Python Agent (Playwright)
├── docker-compose.yml          # Docker 部署配置
└── docs/                      # 文档
```

## 快速开始

### 环境要求

- JDK 21+
- Node.js 22+（Nuxt 4 / CI / Docker 构建均按 22）
- Python 3.11+
- PostgreSQL 18+
- Redis 7+

### 1. 克隆项目

```bash
git clone <repository-url>
cd ai-job-hunter
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际值
```

### 3. 启动基础设施

```bash
docker-compose up -d postgres redis
```

### 4. 启动后端

```bash
cd ai-job-hunter-be
./gradlew bootRun
```

### 5. 启动前端

```bash
cd ai-job-hunter-fe
npm install
npm run dev
```

本地开发：`API_BASE` 保持为空，请求走同源 `/api/*`，由 Nuxt vite 代理到 `http://127.0.0.1:8080`（与生产 Nginx 一致，后端不必开 CORS）。

**注意**：本机 `3000`/`8080` 若已被别的项目（如 pen-bloom）占用，请换端口，例如：

```bash
# 后端 IDEA 或 jar 用 8088；前端：
NUXT_DEV_PROXY_TARGET=http://127.0.0.1:8088 npm run dev -- --port 3010
```

**登录可用用户名或邮箱**（请求字段 `account`）。注册成功后会自动登录进首页；若自动登录失败会跳到登录页并预填邮箱。

登录后可用页面：

| 路径 | 功能 |
|------|------|
| `/` | 仪表盘（简历 / 岗位 / 沟通 / 投递） |
| `/resumes` | 简历上传 / 列表 / 删除（txt / PDF / Word 可抽文本） |
| `/resumes/:id` | 简历详情（解析 + AI 分析/优化建议） |
| `/jobs` | 粘贴 JD 创建岗位 / 列表 |
| `/jobs/:id` | 岗位详情：AI 分析、匹配、打招呼、标记投递 |
| `/conversations` | 手动创建与 HR 的对话 |
| `/conversations/:id` | 消息录入 + AI 推荐回复 |
| `/applications` | 投递看板（状态推进） |
| `/stats` | 今日概览 / 漏斗 / 趋势 / AI 周报 |
| `/settings` | 打招呼模板 + 黑名单 |
| `/profile` | 手机号、求职关键词、意向城市 |

登录/注册页采用 **黛青水墨** 视觉 + **lonely √3** 品牌标（见 `public/logo.svg`）。登录后仪表盘 / 简历上传 / 资料页使用同一套 `--ink-*` 纸面风格（拖拽上传区、统一面板与列表），样式类在 `assets/css/main.css` 的 `.app-*`。

API 返回 **401/403**（token 失效）时会自动清空本地登录态并跳转登录页；请重新登录即可。

### 5.1 Playwright E2E（注册 / 登录）

```bash
cd ai-job-hunter-fe
npm install
npx playwright install chromium
# 先保证 ai-job-hunter-be 已起，且 FE 代理指向它（勿指到别的项目）
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3010 npm run test:e2e
```

用例：
- `e2e/auth.spec.ts`：注册后自动进首页、邮箱/用户名登录、错误密码
- `e2e/jobs.spec.ts`：登录 → 粘贴 JD → 列表/详情（前后端打通）
- `e2e/resume-ai.spec.ts`：上传 txt → AI 分析
- `e2e/conversations.spec.ts`：创建对话 → 详情 → 投递看板
- `e2e/stats.spec.ts`：仪表盘今日 → 统计页 → 设置模板/黑名单

策略与 CI 门禁见后端 `docs/09-TEST-STRATEGY.md` §1.3。每个功能本地须 `*LiveIT` + `npm run test:e2e` 通过后再开下一任务。

### 6. Python Agent（V2，当前不要启）

V1 **没有** BOSS 浏览器自动化。`ai-job-hunter-agent` 仓库若存在，仅作后续规划，本地求职流程不依赖它。

## 生产部署（方案 A，对齐 cogniforge-web）

```
浏览器 → Traefik(Host=DOMAIN) → frontend:80（Nginx）
                                    ├─ /health → 200 ok（compose healthcheck）
                                    ├─ /api/*  → ai-job-hunter-be:8080（保留完整路径）
                                    └─ /*      → SPA 静态文件
```

| 文件 | 作用 |
|------|------|
| `Dockerfile` | 构建时 `API_BASE=` 写入静态产物；运行阶段 Nginx 托管 |
| `nginx.conf` | 同源反代 `/api/`、精确 `/health`、gzip、长连接超时 |
| `docker-compose.yml` | 服务名 `ai-job-hunter-fe`；Traefik 端口 **80** + `Host(\`${DOMAIN}\`)` |

**502 Bad Gateway**：多半是服务器 compose 仍写端口 **3000**（旧 Node），而新镜像是 Nginx **80**。CD 不覆盖远程 compose，需人工改后 `docker compose up -d --force-recreate ai-job-hunter-fe`。

**浏览器显示「危险」**：证书往往正常（Let's Encrypt）；常见是 SPA 写了 `try_files $uri $uri/`，Nginx 补斜杠 301 在 Traefik 后写成 `http://...`。正确写法：`try_files $uri /index.html`（不要 `$uri/`）。

**Chrome「不安全」但 Safari/无痕正常**：多半是普通窗口站点缓存；清该站数据即可，服务端一般不用为这个加 HSTS。

域名打不开时优先查：`.env` 的 `DOMAIN`、前端是否 `healthy`、Traefik 是否指到 80。

## 文档

详细文档请查看后端仓库 `docs/` 目录（规范文档集中在 be）：

| 文档 | 说明 |
|-----|------|
| [01-PRD.md](docs/01-PRD.md) | 产品需求规格书 |
| [02-TDS.md](docs/02-TDS.md) | 技术设计规格书 |
| [03-DOMAIN-MODEL.md](docs/03-DOMAIN-MODEL.md) | 领域模型 |
| [04-ER-DESIGN.md](docs/04-ER-DESIGN.md) | 数据库设计 |
| [05-API-SPECIFICATION.md](docs/05-API-SPECIFICATION.md) | API 规范 |
| [06-AGENT-SPECIFICATION.md](docs/06-AGENT-SPECIFICATION.md) | Agent 规范 |
| [07-FRONTEND-SPECIFICATION.md](docs/07-FRONTEND-SPECIFICATION.md) | 前端规范 |
| [08-DEVELOPMENT-PLAN.md](docs/08-DEVELOPMENT-PLAN.md) | 开发计划 |
| [09-TEST-STRATEGY.md](docs/09-TEST-STRATEGY.md) | 测试策略 |
| [11-SPRINT6-TEST-REPORT.md](docs/11-SPRINT6-TEST-REPORT.md) | V1 测试与发布报告（在 be 仓） |

## 开发指南

### 代码规范

- 遵循各语言/框架的最佳实践
- 使用 TypeScript (前端)
- 使用 JPA/Hibernate (后端)
- 使用 Playwright (Python Agent)

### Git 提交规范

使用 Conventional Commits：

```bash
feat: 新功能
fix: 修复
refactor: 重构
docs: 文档
test: 测试
chore: 任务
```

## License

MIT License
