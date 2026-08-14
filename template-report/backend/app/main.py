from typing import Annotated, Any, Literal

from fastapi import Depends, FastAPI, Header, Query
from fastapi.middleware.cors import CORSMiddleware

from app.deps import get_data_filters
from app.meta import REPORT_META
from app.report_service import query_report_data

app = FastAPI(title="VibeBI Template Report", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "template-report-backend"}


@app.get("/api/meta")
async def report_meta() -> dict:
    """Host syncs filterable fields via this contract endpoint."""
    return REPORT_META


@app.get("/api/report/data")
async def report_data(
    data_filters: Annotated[list[dict[str, Any]], Depends(get_data_filters)],
    start_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    end_date: str | None = Query(default=None, description="YYYY-MM-DD"),
    dimension: Literal["date", "dept"] = Query(default="date"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None,
    x_user_role: Annotated[str | None, Header(alias="X-User-Role")] = None,
) -> dict:
    """Demo report API: apply Host-injected X-Data-Filters."""
    payload = query_report_data(
        data_filters=data_filters,
        start_date=start_date,
        end_date=end_date,
        dimension=dimension,
        page=page,
        page_size=page_size,
    )
    payload["identity"] = {
        "user_id": x_user_id,
        "role": x_user_role,
        "data_filters": data_filters,
    }
    return payload
