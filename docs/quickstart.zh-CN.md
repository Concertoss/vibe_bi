# 快速入门

用脚手架创建报表 → 本地启动 → 挂到底座 → Docker 部署。

**语言：** [English](./quickstart.en.md) · [简体中文](./quickstart.zh-CN.md)

---

## 1. 环境准备

| 工具 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥ 18 | CLI 与前端 |
| Python | ≥ 3.11 | 本地后端 |
| pip | — | Python 依赖 |
| Docker Desktop | 最新 | 整套 compose（推荐） |

检查：

```bash
node -v
python --version
docker --version
docker compose version
```

---

## 2. 用脚手架创建报表

### 2.1 执行命令

在任意工作目录：

```bash
npx create-vibebi sales-board
```

或全局安装：

```bash
npm install -g create-vibebi
vibebi sales-board
```

跳过提问（用默认值）：

```bash
npx create-vibebi sales-board -y
```

【截图：终端执行 `npx create-vibebi`】

### 2.2 交互选项说明

| 提示项 | 含义 | 示例 |
|--------|------|------|
| 项目目录名 | 在当前路径创建的文件夹 | `sales-board` |
| 报表显示名称 | 页面标题 / Host 菜单名 | `销售看板` |
| `report_code` | 网关标识 `/api/proxy/{report_code}/...` | `sales-board` |
| 前端端口 | Vite 端口 | `5175` |
| 后端端口 | FastAPI 端口 | `8002` |
| 自动 npm install | 是否安装前端依赖 | `Y` |

【截图：CLI 问答过程】

### 2.3 生成结果

```text
sales-board/
├── backend/           # FastAPI（/api/meta、数据权限 Header）
├── frontend/          # Vite + React + ECharts 示例
├── .cursorrules       # 本报表 AI 开发约束
├── HOST_INTEGRATION.md
└── docker-compose.yml # 仅本报表的可选 compose
```

---

## 3. 本地启动新报表

开两个终端。

**后端**

```bash
cd sales-board/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

**前端**

```bash
cd sales-board/frontend
npm install          # 若刚才未自动安装
npm run dev
```

验证：

- 页面：http://localhost:5175  
- 健康检查：http://localhost:8002/health  
- 元数据：http://localhost:8002/api/meta  

【截图：浏览器中的报表示例页】

---

## 4. 启动 VibeBI 底座

需要 Host 才能登录、挂菜单、走网关权限。

### 4.1 Docker（推荐）

```bash
git clone https://github.com/Concertoss/vibe_bi.git
cd vibe_bi
docker compose up --build
```

| 服务 | 地址 |
|------|------|
| 底座前端 | http://localhost:5173 |
| 底座 API | http://localhost:8000/health |
| 仓库内示例报表前端 | http://localhost:5174 |
| 仓库内示例报表 API | http://localhost:8001/health |

【截图：`docker compose up` 日志】

### 4.2 本地不使用 Docker

```bash
# 底座后端
cd vibe_bi/host-backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 底座前端（新终端）
cd vibe_bi/host-frontend
npm install
npm run dev
```

### 4.3 登录

打开 http://localhost:5173/login

| 用户 | 密码 | 说明 |
|------|------|------|
| `admin` | `admin123` | 管理员 |
| `viewer` | `viewer123` | 访客（有数据范围） |

【截图：登录页】

---

## 5. 在底座中登记报表

使用 **admin** 账号。

### 5.1 新增菜单

1. 进入 **菜单管理**（`/admin/menus`）。
2. 填写：

| 字段 | 值 |
|------|----|
| 报表名称 | `销售看板` |
| `report_code` | `sales-board` |
| path | `/reports/sales-board` |
| 前端入口 URL | `http://localhost:5175` |
| 后端目标 URL | `http://localhost:8002` |
| 可见角色 | `admin,viewer` |

3. 保存。

【截图：菜单管理表单】

### 5.2 同步元数据

在菜单行或 **报表元数据** 页点击 **同步元数据**。  
Host 会请求 `GET {backend_url}/api/meta` 并缓存可过滤字段。

【截图：同步元数据成功】

### 5.3 配置数据权限（建议）

1. 打开 **数据权限**。
2. 选择主体：角色 / 用户。
3. 选择报表、字段、操作符（`in` / `eq`）、允许值。
4. 保存。

合并规则：**用户规则 ∩ 角色规则**（用户只能更严）。

【截图：数据权限配置】

### 5.4 打开报表

左侧菜单进入新报表。  
无界加载 `component_url`；嵌入后数据请求应走：

```text
/api/proxy/sales-board/api/report/data
```

【截图：Host 内嵌报表】

---

## 6. Docker 部署

### 6.1 整套平台（本仓库）

```bash
cd vibe_bi
docker compose up -d --build
```

停止：

```bash
docker compose down
```

只重建某一服务：

```bash
docker compose up -d --build host-backend
```

### 6.2 单独报表 compose

脚手架生成的目录内有 `docker-compose.yml`：

```bash
cd sales-board
docker compose up --build
```

注意端口不要与底座冲突。

### 6.3 上线前注意

- 修改 JWT / `VIBEBI_SECRET_KEY` 等密钥。
- 生产库可改用 MySQL：`VIBEBI_DATABASE_URL`。
- 前面加 HTTPS 反向代理（Nginx / Caddy）。
- `component_url` 必须是**浏览器能访问**的地址（不能只用 Docker 内网 DNS）。

【截图：Docker Desktop 容器列表】

---

## 7. 验收清单

- [ ] 脚手架命令执行成功  
- [ ] 报表 `/health`、`/api/meta` 正常  
- [ ] 底座已启动（Docker 或本地）  
- [ ] 使用 `admin` 登录  
- [ ] 菜单已创建且元数据已同步  
- [ ] Host 内可打开报表  
- [ ] （可选）数据权限规则生效  

---

## 下一步

- 日常操作：[操作手册](./manual.zh-CN.md) · [User Manual (EN)](./manual.en.md)  
- 问题反馈：https://github.com/Concertoss/vibe_bi/issues  
