# VibeBI

**AI-native lightweight BI host** — authenticate once, mount many reports as micro-frontends, enforce row-level data permissions at the gateway.

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![npm](https://img.shields.io/npm/v/create-vibebi.svg)](https://www.npmjs.com/package/create-vibebi)
[![GitHub](https://img.shields.io/badge/GitHub-Concertoss%2Fvibe__bi-181717?logo=github)](https://github.com/Concertoss/vibe_bi)

**Language:** [English](./README.md) · [简体中文](./README.zh-CN.md)

---

## Why VibeBI?

| Layer | Responsibility |
|-------|----------------|
| **Host** | Login, shell, dynamic menus, JWT, reverse proxy |
| **Data permissions** | Configure filters per role/user from report metadata |
| **Report microservices** | Independent FastAPI + React apps (AI-friendly scaffold) |
| **Wujie** | Sandboxed micro-frontend embedding |

Reports never bypass the host: APIs go through `/api/proxy/{report_code}/...` with injected `X-Data-Filters`.

---

## Quick start

### Option A — Scaffold a new report (no clone required)

```bash
npx create-vibebi sales-board
```

Answer the prompts, start backend/frontend, then register the menu in the Host.  
Full walkthrough: **[Quick Start (EN)](./docs/quickstart.en.md)** · **[快速入门（中文）](./docs/quickstart.zh-CN.md)**

### Option B — Run the full platform with Docker

```bash
git clone https://github.com/Concertoss/vibe_bi.git
cd vibe_bi
docker compose up --build
```

| Service | URL |
|---------|-----|
| Host UI | http://localhost:5173 |
| Host API | http://localhost:8000/health |
| Sample report UI | http://localhost:5174 |
| Sample report API | http://localhost:8001/health |

**Demo accounts**

| User | Password | Role |
|------|----------|------|
| `admin` | `admin123` | Admin |
| `viewer` | `viewer123` | Viewer (scoped data) |

---

## Repository layout

```text
vibe_bi/
├── host-backend/          # FastAPI host: auth, menus, data permissions, proxy
├── host-frontend/         # React host shell + Wujie + admin UI
├── template-report/       # Canonical report template (source of truth)
├── create-vibebi-report/  # npm package `create-vibebi` (CLI: vibebi)
└── docs/                  # Guides (EN / 中文)
```

---

## Documentation

| Doc | English | 中文 |
|-----|---------|------|
| Quick start (CLI → deploy) | [quickstart.en.md](./docs/quickstart.en.md) | [quickstart.zh-CN.md](./docs/quickstart.zh-CN.md) |
| User / ops manual | [manual.en.md](./docs/manual.en.md) | [manual.zh-CN.md](./docs/manual.zh-CN.md) |

---

## Requirements

- **Node.js** ≥ 18
- **Python** ≥ 3.11 (local backend without Docker)
- **Docker** + Docker Compose (recommended for the full stack)

---

## License

Apache License 2.0 — see [LICENSE](./LICENSE).
