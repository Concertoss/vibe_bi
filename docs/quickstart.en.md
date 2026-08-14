# Quick Start

Build a new report with the scaffold, run it locally, plug it into the Host, then deploy with Docker.

**Language:** [English](./quickstart.en.md) · [简体中文](./quickstart.zh-CN.md)

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 | CLI + frontends |
| Python | ≥ 3.11 | Report / host backends (local) |
| pip | — | Python deps |
| Docker Desktop | latest | Full-stack compose (optional but recommended) |

Check:

```bash
node -v
python --version
docker --version
docker compose version
```

---

## 2. Create a report with the scaffold

### 2.1 Run the CLI

In any empty working directory:

```bash
npx create-vibebi sales-board
```

Or install globally:

```bash
npm install -g create-vibebi
vibebi sales-board
```

Skip prompts (defaults):

```bash
npx create-vibebi sales-board -y
```

【Screenshot: terminal running `npx create-vibebi`】

### 2.2 Interactive prompts

| Prompt | Meaning | Example |
|--------|---------|---------|
| Project directory | Folder created under cwd | `sales-board` |
| Report display name | Title shown in UI / Host menu | `Sales Board` |
| `report_code` | Gateway key: `/api/proxy/{report_code}/...` | `sales-board` |
| Frontend port | Vite port | `5175` |
| Backend port | FastAPI port | `8002` |
| Auto `npm install` | Install frontend deps | `Y` |

【Screenshot: CLI prompt answers】

### 2.3 What gets generated

```text
sales-board/
├── backend/           # FastAPI (/api/meta, /api/report/data, X-Data-Filters)
├── frontend/          # Vite + React + ECharts demo
├── .cursorrules       # AI coding rules for this report
├── HOST_INTEGRATION.md
└── docker-compose.yml # Optional local compose for this report only
```

---

## 3. Run the new report locally

Open two terminals.

**Backend**

```bash
cd sales-board/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

**Frontend**

```bash
cd sales-board/frontend
npm install          # if you skipped auto-install
npm run dev
```

Verify:

- UI: http://localhost:5175  
- Health: http://localhost:8002/health  
- Meta: http://localhost:8002/api/meta  

【Screenshot: report page in browser】

---

## 4. Start the VibeBI Host

You need the Host to log in, register menus, and proxy with data permissions.

### 4.1 Docker (recommended)

```bash
git clone https://github.com/Concertoss/vibe_bi.git
cd vibe_bi
docker compose up --build
```

| Service | URL |
|---------|-----|
| Host UI | http://localhost:5173 |
| Host API | http://localhost:8000/health |
| Sample template UI | http://localhost:5174 |
| Sample template API | http://localhost:8001/health |

【Screenshot: `docker compose up` logs】

### 4.2 Local (without Docker)

```bash
# Host backend
cd vibe_bi/host-backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Host frontend (new terminal)
cd vibe_bi/host-frontend
npm install
npm run dev
```

### 4.3 Sign in

Open http://localhost:5173/login

| User | Password | Notes |
|------|----------|-------|
| `admin` | `admin123` | Full admin |
| `viewer` | `viewer123` | Limited data scope |

【Screenshot: login page】

---

## 5. Register the report in the Host

Use an **admin** account.

### 5.1 Add a menu

1. Open **Menu Management** (`/admin/menus`).
2. Fill:

| Field | Value |
|-------|--------|
| Title | `Sales Board` |
| `report_code` | `sales-board` |
| Path | `/reports/sales-board` |
| Component URL | `http://localhost:5175` |
| Backend URL | `http://localhost:8002` |
| Visible roles | `admin,viewer` |

3. Save.

【Screenshot: Menu Management form】

### 5.2 Sync metadata

Still on the menu row (or **Report Metadata** page), click **Sync metadata**.  
Host calls `GET {backend_url}/api/meta` and caches filterable fields.

【Screenshot: sync metadata success】

### 5.3 Configure data permissions (optional but recommended)

1. Open **Data Permissions**.
2. Select subject: **Role** or **User**.
3. Pick report + field (from synced meta) + operator (`in` / `eq`) + allowed values.
4. Save.

Merge rule: **user ∩ role** (user can only narrow).

【Screenshot: data permission rules】

### 5.4 Open the report

From the left sidebar, open the new menu.  
Wujie loads `component_url`; API calls should use Host proxy when embedded:

```text
/api/proxy/sales-board/api/report/data
```

【Screenshot: report embedded in Host shell】

---

## 6. Deploy with Docker

### 6.1 Full platform (this repo)

```bash
cd vibe_bi
docker compose up -d --build
```

Stop:

```bash
docker compose down
```

Rebuild one service:

```bash
docker compose up -d --build host-backend
```

### 6.2 Standalone report compose

Generated reports include a small `docker-compose.yml`. Example:

```bash
cd sales-board
docker compose up --build
```

Adjust published ports if they collide with the Host stack.

### 6.3 Production notes

- Change `VIBEBI_SECRET_KEY` / JWT secret before production.
- Prefer MySQL later via `VIBEBI_DATABASE_URL` (SQLite is for demo).
- Put Host and reports behind HTTPS reverse proxy (Nginx / Caddy).
- Browser-reachable `component_url` must be accessible from users’ browsers (not only Docker DNS).

【Screenshot: Docker Desktop containers running】

---

## 7. Checklist

- [ ] `npx create-vibebi …` finished  
- [ ] Report backend `/health` and `/api/meta` OK  
- [ ] Host Docker or local stack running  
- [ ] Logged in as `admin`  
- [ ] Menu created + metadata synced  
- [ ] Report opens inside Host shell  
- [ ] (Optional) Data permission rules applied  

---

## Next

- Day-to-day operations: [User Manual (EN)](./manual.en.md) · [操作手册（中文）](./manual.zh-CN.md)  
- Issues: https://github.com/Concertoss/vibe_bi/issues  
