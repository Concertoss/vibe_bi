# VibeBI Host Frontend

底座前端：登录、动态侧栏、菜单/元数据/数据权限管理、Wujie 微前端容器。

## 本地启动

```bash
cd host-frontend
npm install
npm run dev
```

http://localhost:5173 · 账号 `admin` / `admin123`

## 管理路由

| 路径 | 说明 |
|------|------|
| `/admin/menus` | 菜单 CRUD + 同步元数据 |
| `/admin/report-metas` | 查看报表可过滤字段 |
| `/admin/data-permissions` | 角色/用户数据权限规则 |

子应用可通过 `window.$wujie.props.token` / `proxyBase` 走网关代理。
