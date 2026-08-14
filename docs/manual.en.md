# User Manual

Day-to-day operations for admins and report developers. Replace 【】 placeholders with your own screenshots.

**Language:** [English](./manual.en.md) · [简体中文](./manual.zh-CN.md)

See also: [Quick Start](./quickstart.en.md)

---

## 1. Overview

VibeBI has three layers:

1. **Host** — login, menus, data-permission admin, API gateway  
2. **Report microservices** — independent apps embedded via Wujie  
3. **Scaffold `create-vibebi`** — generates contract-compliant reports  

【Screenshot: architecture / home dashboard】

---

## 2. Sign in / out

1. Open the Host (default http://localhost:5173 ).  
2. Enter username and password.  
3. Top-right shows user and role; **Sign out** clears the token.  

Demo accounts:

| User | Password | Role |
|------|----------|------|
| `admin` | `admin123` | Admin |
| `viewer` | `viewer123` | Viewer |

【Screenshot: login page】  
【Screenshot: header user chip】

---

## 3. Shell and sidebar

- Left: **Home**, visible reports, admin links (admin only)  
- Center: page content or Wujie report container  

【Screenshot: sidebar and home】

Reports without menu permission do not appear; gateway calls are also denied.

---

## 4. Menu management (admin)

Path: `/admin/menus`

### 4.1 Create a menu

| Field | Description |
|-------|-------------|
| Title | Sidebar label |
| report_code | Unique id for the proxy |
| path | Host route, e.g. `/reports/xxx` |
| Component URL | Wujie entry (browser-reachable) |
| Backend URL | Upstream API base for the gateway |
| Visible roles | Comma-separated `role_key`s |

【Screenshot: create menu form】  
【Screenshot: menu list】

### 4.2 Sync metadata

Click **Sync metadata**. The report must be up and expose `GET /api/meta`.

【Screenshot: sync button】  
【Screenshot: sync error】

### 4.3 Delete

Confirm before delete; related permission rules are not auto-cleaned in all cases.

【Screenshot: delete confirm】

---

## 5. Report metadata (admin)

Path: `/admin/report-metas`

Shows filterable fields used by the data-permission UI.

| Column | Meaning |
|--------|---------|
| field_key | Field name in rules |
| Label | Display name |
| Operators | e.g. `in`, `eq` |
| Values | Enum options |
| Required | If true, missing rules → 403 |

【Screenshot: metadata table】

---

## 6. Data permissions (admin)

Path: `/admin/data-permissions`

### 6.1 By role

Select role → report → field → operator → values → save.

【Screenshot: role rules editor】

### 6.2 By user

User filters **intersect** role filters (user can only narrow).

【Screenshot: user tab】

### 6.3 Global `report_code = *`

Applies a dimension across reports; keep field names consistent.

### 6.4 How it applies

Requests to:

```text
/api/proxy/{report_code}/...
```

Gateway checks menu access, merges rules, injects `X-Data-Filters` (and legacy `X-Data-Scope`).

【Screenshot: Network panel with X-Data-Filters】

---

## 7. Using a report

1. Open the sidebar item.  
2. Host loads `component_url` via Wujie.  
3. Child apps may read `window.$wujie.props.token` / `proxyBase`.  

【Screenshot: embedded report】  
【Screenshot: missing component_url】

Opening the child UI alone (no Host) may lack gateway headers — **always use the proxy in production**.

---

## 8. Developing with the scaffold

```bash
npx create-vibebi my-report
```

Respect generated `.cursorrules`: `/api/meta`, `X-Data-Filters`, shared chart wrapper, skeletons.

【Screenshot: generated folder tree】  
【Screenshot: `.cursorrules` excerpt】

Details: [Quick Start](./quickstart.en.md).

---

## 9. Operations

### 9.1 Docker

```bash
docker compose up -d --build
docker compose logs -f host-backend
docker compose down
```

【Screenshot: running containers】

### 9.2 Health checks

| Service | URL |
|---------|-----|
| Host | http://localhost:8000/health |
| Sample report | http://localhost:8001/health |

### 9.3 Data

Default SQLite: `host-backend/data/vibebi.db`  
Switch later with `VIBEBI_DATABASE_URL` (e.g. MySQL).

【Screenshot: data directory】

### 9.4 Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login / proxy error | Host API down | Start host-backend / Docker |
| Sync meta 502 | Report down / bad URL | Check backend_url & port |
| Blank micro-app | component_url not reachable in browser | Use localhost / public URL |
| 403 menu | Role not bound | Fix RoleMenu / visible_roles |
| 403 data | required field, no rule | Add data permission |
| Unfiltered data | Not using proxy | Call `/api/proxy/{code}/...` |

【Screenshot: typical error UI】

---

## 10. Security

- Change default passwords and JWT secret before production.  
- Do not commit tokens, `.env`, or DB files.  
- Terminate TLS in front of Host and reports.  

---

## 11. Support

- Issues: https://github.com/Concertoss/vibe_bi/issues  
- Quick start: [quickstart.en.md](./quickstart.en.md)  
