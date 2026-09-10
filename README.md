# AI Job Hunter

> AI 驱动的 BOSS 直聘自动求职助手

## 项目简介

AI Job Hunter 是一款面向个人用户的 **AI 自动求职助手**，帮助用户自动完成 BOSS 直聘上的岗位搜索、打招呼、聊天回复、简历投递等求职全流程。

**核心功能：**

- 📄 **简历管理**：上传、解析、分析、优化简历
- 💼 **智能岗位分析**：解析 JD、计算简历-岗位匹配度
- 💬 **个性化打招呼**：根据不同 JD 生成不同的打招呼话术
- 🤖 **AI 聊天回复**：HR 回复后自动生成回复话术
- 📤 **智能简历投递**：根据岗位自动选择最匹配的简历
- ⚙️ **自动化模式**：全自动 / 半自动 / 手动，可自由切换

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│              Vue 3 + Nuxt 3 + shadcn-vue (前端)             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Spring Boot (Java) 后端                     │
│  • 业务 API                                                 │
│  • AI Agent (LLM 调用)                                     │
│  • 数据存储                                                 │
└─────────────────────────────────────────────────────────────┘
                              │
         ┌───────────────────┼───────────────────┐
         │                   │                    │
         ▼                   ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Python Agent   │ │  PostgreSQL     │ │     Redis      │
│  (Playwright)   │ │                 │ │                │
│  BOSS 自动化    │ │                 │ │                │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 技术栈

| 模块 | 技术 | 说明 |
|-----|------|------|
| 前端 | Vue 3 + Nuxt 3 + shadcn-vue | 现代化前端框架 |
| 后端 | Spring Boot 3 + JDK 21 | 企业级后端框架 |
| Agent | Python 3.11 + Playwright | BOSS 浏览器自动化 |
| 数据库 | PostgreSQL 18 | 核心业务数据 |
| 缓存 | Redis | 任务队列、缓存 |
| AI | OpenAI / DeepSeek | LLM 能力 |

## 项目结构

```
ai-job-hunter/
├── ai-job-hunter-be/          # Java 后端 (Spring Boot)
├── ai-job-hunter-fe/          # Nuxt 前端 (Vue 3 + shadcn-vue)
├── ai-job-hunter-agent/        # Python Agent (Playwright)
├── docker-compose.yml          # Docker 部署配置
└── docs/                      # 文档
```

## 快速开始

### 环境要求

- JDK 21+
- Node.js 18+
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
pnpm install
pnpm dev
```

### 6. 启动 Python Agent

```bash
cd ai-job-hunter-agent
poetry install
poetry run playwright install chromium
poetry run python -m src.main --mode server --port 8081
```

## 文档

详细文档请查看 `docs/` 目录：

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
