"""Universal reverse proxy: ANY /api/proxy/{report_code}/{path:path}"""

from __future__ import annotations

import json
from typing import Any
from urllib.parse import urljoin

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.auth import decode_access_token
from app.database import get_db
from app.filters import resolve_filters_for_user, user_has_report_menu_access
from app.models import Menu, User

router = APIRouter(prefix="/proxy", tags=["proxy"])

_HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
    "authorization",
}


def _extract_bearer(request: Request) -> str:
    auth = request.headers.get("Authorization") or request.headers.get("authorization")
    if not auth or not auth.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return auth.split(" ", 1)[1].strip()


def _load_user_from_token(db: Session, token: str) -> User:
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from None

    user = db.scalar(select(User).options(joinedload(User.role)).where(User.id == user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def _build_target_url(backend_url: str, path: str, query: str) -> str:
    base = backend_url if backend_url.endswith("/") else backend_url + "/"
    joined = urljoin(base, path.lstrip("/")) if path else base.rstrip("/")
    if query:
        return f"{joined}?{query}"
    return joined


@router.api_route("/{report_code}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
@router.api_route(
    "/{report_code}/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
)
async def reverse_proxy(
    report_code: str,
    request: Request,
    db: Session = Depends(get_db),
    path: str = "",
) -> Response:
    token = _extract_bearer(request)
    user = _load_user_from_token(db, token)

    menu = db.scalar(
        select(Menu).where(Menu.report_code == report_code, Menu.is_active.is_(True))
    )
    if menu is None or not menu.backend_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown report_code or missing backend_url: {report_code}",
        )

    if not user_has_report_menu_access(db, user, report_code):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No menu permission for this report",
        )

    filters, data_scope = resolve_filters_for_user(db, user=user, report_code=report_code)
    target_url = _build_target_url(menu.backend_url, path, request.url.query)

    outbound_headers: dict[str, str] = {}
    for key, value in request.headers.items():
        if key.lower() in _HOP_BY_HOP:
            continue
        outbound_headers[key] = value

    outbound_headers["X-User-Id"] = str(user.id)
    outbound_headers["X-User-Role"] = user.role.role_key
    outbound_headers["X-Roles"] = user.role.role_key
    outbound_headers["X-Data-Filters"] = json.dumps(
        [f.to_dict() for f in filters],
        ensure_ascii=True,
    )
    outbound_headers["X-Data-Scope"] = json.dumps(data_scope, ensure_ascii=True)

    body = await request.body()

    try:
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=False) as client:
            upstream = await client.request(
                method=request.method,
                url=target_url,
                headers=outbound_headers,
                content=body if body else None,
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream unreachable: {exc}",
        ) from exc

    response_headers: dict[str, Any] = {}
    for key, value in upstream.headers.multi_items():
        if key.lower() in _HOP_BY_HOP:
            continue
        if key.lower() in {"content-encoding", "content-length"}:
            continue
        response_headers[key] = value

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers,
        media_type=upstream.headers.get("content-type"),
    )
