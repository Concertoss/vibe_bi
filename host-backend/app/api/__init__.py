# Re-export for convenience: from app.api import ...
from app.api.auth import router as auth_router
from app.api.menus import router as menus_router

__all__ = ["auth_router", "menus_router"]
