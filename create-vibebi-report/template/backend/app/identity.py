"""Legacy identity helper — prefer app.deps.get_data_scope for new code."""

from dataclasses import dataclass, field
import json

from fastapi import Header, Request


@dataclass
class GatewayIdentity:
    user_id: str | None
    role: str | None
    roles: list[str]
    data_scope: list[str] = field(default_factory=list)
    raw_headers: dict[str, str] = field(default_factory=dict)


def read_gateway_identity(
    request: Request,
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_role: str | None = Header(default=None, alias="X-User-Role"),
    x_roles: str | None = Header(default=None, alias="X-Roles"),
    x_data_scope: str | None = Header(default=None, alias="X-Data-Scope"),
) -> GatewayIdentity:
    roles = [r.strip() for r in (x_roles or "").split(",") if r.strip()]
    if x_user_role and x_user_role not in roles:
        roles.insert(0, x_user_role)

    scope: list[str] = []
    if x_data_scope:
        try:
            parsed = json.loads(x_data_scope)
            if isinstance(parsed, list):
                scope = [str(x) for x in parsed]
        except json.JSONDecodeError:
            scope = [s.strip() for s in x_data_scope.split(",") if s.strip()]

    return GatewayIdentity(
        user_id=x_user_id,
        role=x_user_role or (roles[0] if roles else None),
        roles=roles,
        data_scope=scope,
        raw_headers={k: v for k, v in request.headers.items() if k.lower().startswith("x-")},
    )
