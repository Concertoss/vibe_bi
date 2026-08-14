# VibeBI

轻量级、AI 原生的报表底座系统。  
仓库：https://github.com/Concertoss/vibe_bi

## 30 秒新建一张报表

```bash
npx create-vibebi sales-board
```

或：

```bash
npm install -g create-vibebi
vibebi sales-board
```

> 不用先 clone 本仓库。淘宝镜像会自动同步官方 npm，**不必单独上传到淘宝**；若刚发布还装不到，多半是镜像延迟，可临时：
> `npm install -g create-vibebi --registry=https://registry.npmjs.org/`

## 仓库结构

| 目录 | 说明 |
|------|------|
| `host-backend/` | 底座后端：鉴权、菜单、数据权限、反向代理网关 |
| `host-frontend/` | 底座前端：登录、Shell、Wujie、权限管理 |
| `template-report/` | 子报表脚手架源模板 |
| `create-vibebi-report/` | npm 包 `create-vibebi`（命令 `vibebi`） |

## 启动底座（Docker）

```bash
git clone https://github.com/Concertoss/vibe_bi.git
cd vibe_bi
docker compose up --build
```

| 服务 | 地址 |
|------|------|
| Host 前端 | http://localhost:5173 |
| Host 后端 | http://localhost:8000/health |
| 模板报表前端 | http://localhost:5174 |
| 模板报表后端 | http://localhost:8001/health |

默认账号：`admin` / `admin123`
