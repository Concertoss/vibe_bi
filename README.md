# VibeBI

轻量级、AI 原生的报表底座系统。

## 结构

| 目录 | 说明 |
|------|------|
| `host-backend/` | 底座后端：鉴权、菜单、数据权限、反向代理网关 |
| `host-frontend/` | 底座前端：登录、Shell、Wujie、权限管理 |
| `template-report/` | 子报表脚手架源模板 |
| `create-vibebi-report/` | **一键生成新报表的 CLI**（任意目录可用） |

## 新建一张报表（脚手架命令）

```bash
# 本机一次性链接（开发）
cd create-vibebi-report
npm run sync-template
npm link

# 然后在任意目录
create-vibebi-report sales-board
```

推到 GitHub / 发布 npm 后的用法见 [create-vibebi-report/README.md](create-vibebi-report/README.md)。

## 一键启动底座（Docker）

```bash
docker compose up --build
```

| 服务 | 地址 |
|------|------|
| Host 前端 | http://localhost:5173 |
| Host 后端 | http://localhost:8000/health |
| 模板报表前端 | http://localhost:5174 |
| 模板报表后端 | http://localhost:8001/health |

默认账号：`admin` / `admin123`

## 本地分别启动

见各子目录 `README.md`。原始需求说明见 [READEME.md](READEME.md)。
