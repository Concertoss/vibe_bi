# VibeBI

**AI 原生的轻量报表底座** — 一次登录，微前端挂载多报表，网关统一下发行级数据权限。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/create-vibebi.svg)](https://www.npmjs.com/package/create-vibebi)
[![GitHub](https://img.shields.io/badge/GitHub-Concertoss%2Fvibe__bi-181717?logo=github)](https://github.com/Concertoss/vibe_bi)

**语言：** [English](./README.md) · [简体中文](./README.zh-CN.md)

---

## 为什么选 VibeBI？

| 层级 | 职责 |
|------|------|
| **底座 Host** | 登录、Shell、动态菜单、JWT、反向代理 |
| **数据权限** | 按报表元数据为角色/用户配置过滤条件 |
| **报表微服务** | 独立 FastAPI + React（便于 AI / 脚手架生成） |
| **无界 Wujie** | JS/CSS 沙箱嵌入子报表 |

子报表不直连绕过底座：请求走 `/api/proxy/{report_code}/...`，网关注入 `X-Data-Filters`。

---

## 快速开始

### 方式 A — 用脚手架新建报表（无需先 clone）

```bash
npx create-vibebi sales-board
```

按提示填写后启动前后端，再到 Host 登记菜单。  
完整步骤：**[快速入门](./docs/quickstart.zh-CN.md)** · **[Quick Start (EN)](./docs/quickstart.en.md)**

### 方式 B — Docker 一键启动整套平台

```bash
git clone https://github.com/Concertoss/vibe_bi.git
cd vibe_bi
docker compose up --build
```

| 服务 | 地址 |
|------|------|
| 底座前端 | http://localhost:5173 |
| 底座 API | http://localhost:8000/health |
| 示例报表前端 | http://localhost:5174 |
| 示例报表 API | http://localhost:8001/health |

**演示账号**

| 用户 | 密码 | 角色 |
|------|------|------|
| `admin` | `admin123` | 管理员 |
| `viewer` | `viewer123` | 访客（有数据范围） |

---

## 仓库结构

```text
vibe_bi/
├── host-backend/          # FastAPI 底座：鉴权、菜单、数据权限、网关
├── host-frontend/         # React Shell + Wujie + 管理台
├── template-report/       # 报表模板源（脚手架同步来源）
├── create-vibebi-report/  # npm 包 create-vibebi（命令 vibebi）
└── docs/                  # 文档（中 / 英）
```

---

## 文档

| 文档 | 中文 | English |
|------|------|---------|
| 快速入门（脚手架 → 部署） | [quickstart.zh-CN.md](./docs/quickstart.zh-CN.md) | [quickstart.en.md](./docs/quickstart.en.md) |
| 操作手册 | [manual.zh-CN.md](./docs/manual.zh-CN.md) | [manual.en.md](./docs/manual.en.md) |

---

## 环境要求

- **Node.js** ≥ 18
- **Python** ≥ 3.11（不用 Docker 时）
- **Docker** + Docker Compose（推荐）

---

## 许可证

Apache License 2.0 — 见 [LICENSE](./LICENSE)。
