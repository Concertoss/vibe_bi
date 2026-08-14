"""Dept / role -> data scope mapping for gateway injection."""

from app.core.config import settings

# dept_code -> allowed regions
DEPT_SCOPE_MAP: dict[str, list[str]] = {
    "HQ": list(settings.default_data_scopes),
    "EAST": ["华东区"],
    "NORTH": ["华北区"],
    "SOUTH": ["华南区"],
    "WEST": ["西南区"],
}


def resolve_data_scope(*, role_key: str, dept_code: str) -> list[str]:
    """Admin sees all scopes; others follow dept_code mapping."""
    if role_key == "admin":
        return list(settings.default_data_scopes)
    return list(DEPT_SCOPE_MAP.get(dept_code, DEPT_SCOPE_MAP.get("HQ", [])))
