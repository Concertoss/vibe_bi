# 操作手册

面向管理员与报表开发者的日常操作说明。截图位置用【】标注，可自行替换。

**语言：** [English](./manual.en.md) · [简体中文](./manual.zh-CN.md)

相关文档：[快速入门](./quickstart.zh-CN.md)

---

## 1. 产品概览

VibeBI 分为三层：

1. **底座 Host**：登录、菜单、数据权限配置、API 网关  
2. **子报表**：独立前后端，通过无界嵌入 Host  
3. **脚手架 `create-vibebi`**：快速生成符合契约的子报表  

【截图：系统架构示意 / 首页工作台】

---

## 2. 登录与退出

1. 打开底座地址（默认 http://localhost:5173 ）。  
2. 输入用户名、密码，点击登录。  
3. 右上角可查看用户名、角色；点击 **退出** 清除 Token。  

演示账号：

| 用户 | 密码 | 角色 |
|------|------|------|
| `admin` | `admin123` | 管理员 |
| `viewer` | `viewer123` | 访客 |

【截图：登录页】  
【截图：登录后顶栏用户信息】

---

## 3. 工作台与侧栏

- 左侧：**工作台** + 当前用户可见的报表菜单 +（管理员）管理入口  
- 中间：当前页面内容；打开报表时为无界微前端容器  

【截图：侧栏菜单与工作台】

无菜单权限的报表不会出现在侧栏；直接调用网关也会被拒绝。

---

## 4. 菜单管理（管理员）

路径：`/admin/menus`

### 4.1 新增报表菜单

填写并保存：

| 字段 | 说明 |
|------|------|
| 报表名称 | 侧栏显示名 |
| report_code | 唯一编码，网关路径用 |
| path | 前端路由，如 `/reports/xxx` |
| 前端入口 URL | Wujie 加载地址（浏览器可访问） |
| 后端目标 URL | 网关转发的子服务地址 |
| 可见角色 | 逗号分隔 `role_key`，如 `admin,viewer` |

【截图：新增菜单表单】  
【截图：菜单列表】

### 4.2 同步元数据

在列表中点击 **同步元数据**，或到「报表元数据」页操作。  
要求子报表已启动且实现 `GET /api/meta`。

【截图：同步元数据按钮】  
【截图：同步失败时的错误提示】

### 4.3 删除菜单

删除前请确认没有强依赖该 `report_code` 的权限规则；删除不可自动恢复。

【截图：删除确认框】

---

## 5. 报表元数据（管理员）

路径：`/admin/report-metas`

用途：查看子报表声明的可过滤字段，供数据权限配置使用。

| 列 | 含义 |
|----|------|
| 字段 field_key | 权限规则里的字段名 |
| 标签 | 展示名 |
| 操作符 | 支持的 `in` / `eq` 等 |
| 枚举值 | 可选值列表 |
| 必填 | `required=true` 时无规则会 403 |

【截图：元数据字段表格】

---

## 6. 数据权限（管理员）

路径：`/admin/data-permissions`

### 6.1 按角色配置

1. Tab 选 **按角色**，选择角色。  
2. 选择报表、`field_key`、操作符、允许值。  
3. 保存后出现在右侧规则列表。  

【截图：角色 Tab 与新增规则】

### 6.2 按用户配置

1. Tab 选 **按用户**。  
2. 用户规则与角色规则**取交集**（只能更严，不能更宽）。  

【截图：用户 Tab】

### 6.3 全局报表码 `*`

`report_code = *` 表示跨报表共用维度（如统一区域字段）。慎用，先保证各报表字段名一致。

### 6.4 生效方式

用户打开报表并请求：

```text
/api/proxy/{report_code}/...
```

网关校验菜单权限 → 合并规则 → 注入：

- `X-User-Id` / `X-User-Role`  
- `X-Data-Filters`  
- `X-Data-Scope`（兼容旧逻辑）  

【截图：浏览器 Network 中带 X-Data-Filters 的请求】

---

## 7. 查看与使用报表

1. 侧栏点击报表菜单。  
2. Host 用无界加载 `component_url`。  
3. 子应用可通过 `window.$wujie.props.token` / `proxyBase` 访问网关。  

【截图：嵌入中的报表】  
【截图：无 component_url 时的提示】

独立打开子报表前端（不经 Host）时，可能没有权限 Header，示例接口会回退到演示全量数据——**生产环境请始终经网关访问**。

---

## 8. 用脚手架开发新报表

```bash
npx create-vibebi my-report
```

开发约束见生成目录内 `.cursorrules`，必须包含：

- `GET /api/meta`  
- 业务查询使用 `X-Data-Filters`（`get_data_filters`）  
- 前端统一图表封装与骨架屏  

【截图：脚手架生成目录结构】  
【截图：`.cursorrules` 内容节选】

更细步骤见 [快速入门](./quickstart.zh-CN.md)。

---

## 9. 服务运维

### 9.1 Docker 常用命令

```bash
# 启动
docker compose up -d --build

# 查看日志
docker compose logs -f host-backend

# 停止
docker compose down
```

【截图：Docker 容器运行状态】

### 9.2 健康检查

| 服务 | URL |
|------|-----|
| Host | http://localhost:8000/health |
| 模板报表 | http://localhost:8001/health |

### 9.3 数据文件

默认 SQLite：`host-backend/data/vibebi.db`  
备份时复制该文件即可；换 MySQL 时配置 `VIBEBI_DATABASE_URL`。

【截图：data 目录】

### 9.4 常见问题

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 登录失败 / 代理错误 | Host 后端未启动 | 启动 `host-backend` 或检查 Docker |
| 同步元数据 502 | 子报表未启动或 backend_url 错误 | 检查端口与 URL |
| 报表空白 | component_url 浏览器不可达 | 改为 localhost/公网可访问地址 |
| 403 无菜单权限 | 角色未绑定菜单 | 检查 RoleMenu / 可见角色 |
| 403 缺数据权限 | 字段 `required` 且无规则 | 在数据权限中补规则 |
| 数据未过滤 | 请求未走网关 | 确认使用 `/api/proxy/{code}/...` |

【截图：典型错误提示页】

---

## 10. 安全建议

- 上线前修改默认账号密码与 JWT Secret。  
- 不要把 Token、`.env`、数据库文件提交到公开仓库。  
- 生产环境为 Host 与报表配置 HTTPS。  

---

## 11. 获取帮助

- 仓库 Issues：https://github.com/Concertoss/vibe_bi/issues  
- 快速入门：[quickstart.zh-CN.md](./quickstart.zh-CN.md)  
