# VibeBI Host Backend

底座后端：用户 / 角色 / 菜单（SQLite）+ JWT 鉴权 + 数据权限 + 万能反向代理网关。

## 快速启动

```bash
cd host-backend
pip install -r requirements.txt
python -m scripts.init_db   # 可选；启动时也会自动建表并种子数据
uvicorn app.main:app --reload --port 8000
```

默认账号：

| 用户 | 密码 | 角色 | 部门 |
|------|------|------|------|
| `admin` | `admin123` | admin | HQ |
| `viewer` | `viewer123` | viewer | EAST |

## 主要 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | JWT 登录 |
| GET | `/api/auth/current-user` | 当前用户 + 可用菜单 |
| CRUD | `/api/admin/menus` | 菜单管理 |
| GET/POST | `/api/admin/report-metas` / `.../sync` | 报表元数据缓存与同步 |
| CRUD | `/api/admin/data-permissions` | 角色/用户数据权限规则 |
| ANY | `/api/proxy/{report_code}/{path}` | 反向代理并注入过滤 Header |

代理强制注入：

- `X-User-Id` / `X-User-Role`
- `X-Data-Filters`：`[{"field":"dept","op":"in","values":["华东区"]}]`
- `X-Data-Scope`：兼容旧子报表（从 region/dept 规则回填）

合并语义：用户规则 ∩ 角色规则；`required` 字段无规则时 403。

## Docker

```bash
docker compose up host-backend
```
