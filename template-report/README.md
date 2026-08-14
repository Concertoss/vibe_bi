# VibeBI Template Report

AI 报表快速开发脚手架：FastAPI 子服务 + Vite/React/ECharts 前端，可被 Host 经 Wujie 嵌入。

## 启动

```bash
# backend :8001
cd template-report/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# frontend :5174
cd template-report/frontend
npm install
npm run dev
```

- 演示页：http://localhost:5174  
- 接口：http://localhost:8001/api/report/data  
- 可手动带 Header：`X-Data-Scope: ["华东区","华北区"]`

## 关键文件

| 路径 | 说明 |
|------|------|
| `backend/app/deps.py` | `get_data_scope` / `build_dept_in_clause` |
| `backend/app/main.py` | `/api/report/data` 演示接口 |
| `frontend/src/pages/ReportDemo.tsx` | 标准报表示例页 |
| `frontend/src/components/charts/BaseChart.tsx` | 统一 ECharts 封装 |
| `frontend/src/lib/http.ts` | axios + Wujie Token |
| `.cursorrules` | AI 开发硬性规范 |

开发约束见 [.cursorrules](.cursorrules)。
