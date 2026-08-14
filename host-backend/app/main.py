from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.data_permissions import router as data_permissions_router
from app.api.menus import router as menus_router
from app.core.config import settings
from app.database import SessionLocal, init_db
from app.proxy import router as proxy_router
from app.seed import seed_data_permissions_if_empty, seed_if_empty


def _ensure_sqlite_dir() -> None:
    url = settings.database_url
    if url.startswith("sqlite:///./"):
        relative = url.removeprefix("sqlite:///./")
        Path(relative).parent.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _ensure_sqlite_dir()
    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
        seed_data_permissions_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(menus_router, prefix="/api")
app.include_router(data_permissions_router, prefix="/api")
app.include_router(proxy_router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "host-backend"}
