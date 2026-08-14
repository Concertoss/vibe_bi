from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="VIBEBI_", env_file=".env", extra="ignore")

    app_name: str = "VibeBI Host Backend"
    debug: bool = True

    # SQLite by default; switch to MySQL later via DATABASE_URL
    # Example MySQL: mysql+pymysql://user:pass@host:3306/vibebi
    database_url: str = "sqlite:///./data/vibebi.db"

    secret_key: str = "vibebi-dev-secret-change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24

    # dept_code -> data scopes injected as X-Data-Scope
    # HQ / admin-like depts see all regions
    default_data_scopes: list[str] = ["华东区", "华北区", "华南区", "西南区"]

    # Seed URLs (Docker: set backend to service DNS, component stays browser-reachable)
    seed_template_component_url: str = "http://localhost:5174"
    seed_template_backend_url: str = "http://localhost:8001"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
