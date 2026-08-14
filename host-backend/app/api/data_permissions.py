"""Admin APIs: report metadata sync + data permission rules."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from urllib.parse import urljoin

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import DataPermissionRule, Menu, ReportMeta, Role, User
from app.schemas import (
    DataPermissionRuleCreate,
    DataPermissionRuleOut,
    DataPermissionRuleUpdate,
    FilterableFieldOut,
    ReportMetaOut,
    RoleOut,
    UserOut,
)

router = APIRouter(prefix="/admin", tags=["admin-data-permission"])


def _meta_to_out(row: ReportMeta) -> ReportMetaOut:
    try:
        payload = json.loads(row.meta_json or "{}")
    except json.JSONDecodeError:
        payload = {}
    raw_fields = payload.get("filterable_fields") or []
    fields: list[FilterableFieldOut] = []
    for f in raw_fields:
        if not isinstance(f, dict) or not f.get("field_key"):
            continue
        fields.append(
            FilterableFieldOut(
                field_key=str(f["field_key"]),
                label=str(f.get("label") or f["field_key"]),
                value_type=str(f.get("value_type") or "enum"),
                operators=list(f.get("operators") or ["in", "eq"]),
                value_source=str(f.get("value_source") or "static"),
                values=[str(v) for v in (f.get("values") or [])],
                values_api=f.get("values_api"),
                required=bool(f.get("required") or False),
            )
        )
    return ReportMetaOut(
        id=row.id,
        report_code=row.report_code,
        title=row.title or payload.get("title") or row.report_code,
        meta_json=payload,
        filterable_fields=fields,
        synced_at=row.synced_at.isoformat() if row.synced_at else None,
    )


def _rule_to_out(rule: DataPermissionRule) -> DataPermissionRuleOut:
    try:
        values = json.loads(rule.values_json or "[]")
    except json.JSONDecodeError:
        values = []
    if not isinstance(values, list):
        values = []
    return DataPermissionRuleOut(
        id=rule.id,
        subject_type=rule.subject_type,
        subject_id=rule.subject_id,
        report_code=rule.report_code,
        field_key=rule.field_key,
        operator=rule.operator,
        values=[str(v) for v in values],
        effect=rule.effect,
        priority=rule.priority,
    )


# ----- roles / users (for permission UI) -----


@router.get("/roles", response_model=list[RoleOut])
def list_roles(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[Role]:
    return list(db.scalars(select(Role).order_by(Role.id.asc())).all())


@router.get("/users", response_model=list[UserOut])
def list_users(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> list[User]:
    from sqlalchemy.orm import joinedload

    return list(
        db.scalars(select(User).options(joinedload(User.role)).order_by(User.id.asc())).all()
    )


# ----- report metas -----


@router.get("/report-metas", response_model=list[ReportMetaOut])
def list_report_metas(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[ReportMetaOut]:
    rows = list(db.scalars(select(ReportMeta).order_by(ReportMeta.report_code.asc())).all())
    return [_meta_to_out(r) for r in rows]


@router.get("/report-metas/{report_code}", response_model=ReportMetaOut)
def get_report_meta(
    report_code: str,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ReportMetaOut:
    row = db.scalar(select(ReportMeta).where(ReportMeta.report_code == report_code))
    if row is None:
        raise HTTPException(status_code=404, detail="Report meta not found — sync first")
    return _meta_to_out(row)


@router.post("/report-metas/{report_code}/sync", response_model=ReportMetaOut)
async def sync_report_meta(
    report_code: str,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ReportMetaOut:
    menu = db.scalar(select(Menu).where(Menu.report_code == report_code))
    if menu is None or not menu.backend_url:
        raise HTTPException(status_code=404, detail="Menu/backend_url not found for report_code")

    meta_url = urljoin(
        menu.backend_url if menu.backend_url.endswith("/") else menu.backend_url + "/",
        "api/meta",
    )
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(meta_url)
            resp.raise_for_status()
            payload = resp.json()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch /api/meta from {meta_url}: {exc}",
        ) from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail="Invalid /api/meta payload")

    title = str(payload.get("title") or menu.title)
    row = db.scalar(select(ReportMeta).where(ReportMeta.report_code == report_code))
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if row is None:
        row = ReportMeta(
            report_code=report_code,
            title=title,
            meta_json=json.dumps(payload, ensure_ascii=False),
            synced_at=now,
        )
        db.add(row)
    else:
        row.title = title
        row.meta_json = json.dumps(payload, ensure_ascii=False)
        row.synced_at = now
    db.commit()
    db.refresh(row)
    return _meta_to_out(row)


# ----- data permission rules -----


@router.get("/data-permissions", response_model=list[DataPermissionRuleOut])
def list_data_permissions(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
    subject_type: str | None = Query(default=None),
    subject_id: int | None = Query(default=None),
    report_code: str | None = Query(default=None),
) -> list[DataPermissionRuleOut]:
    stmt = select(DataPermissionRule)
    if subject_type:
        stmt = stmt.where(DataPermissionRule.subject_type == subject_type)
    if subject_id is not None:
        stmt = stmt.where(DataPermissionRule.subject_id == subject_id)
    if report_code:
        stmt = stmt.where(DataPermissionRule.report_code == report_code)
    stmt = stmt.order_by(DataPermissionRule.id.asc())
    return [_rule_to_out(r) for r in db.scalars(stmt).all()]


@router.post(
    "/data-permissions",
    response_model=DataPermissionRuleOut,
    status_code=status.HTTP_201_CREATED,
)
def create_data_permission(
    payload: DataPermissionRuleCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> DataPermissionRuleOut:
    if payload.subject_type == "role" and db.get(Role, payload.subject_id) is None:
        raise HTTPException(status_code=400, detail="Role not found")
    if payload.subject_type == "user" and db.get(User, payload.subject_id) is None:
        raise HTTPException(status_code=400, detail="User not found")

    rule = DataPermissionRule(
        subject_type=payload.subject_type,
        subject_id=payload.subject_id,
        report_code=payload.report_code,
        field_key=payload.field_key,
        operator=payload.operator,
        values_json=json.dumps(payload.values, ensure_ascii=False),
        effect=payload.effect or "allow",
        priority=payload.priority,
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return _rule_to_out(rule)


@router.put("/data-permissions/{rule_id}", response_model=DataPermissionRuleOut)
def update_data_permission(
    rule_id: int,
    payload: DataPermissionRuleUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> DataPermissionRuleOut:
    rule = db.get(DataPermissionRule, rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    data = payload.model_dump(exclude_unset=True)
    if "values" in data:
        rule.values_json = json.dumps(data.pop("values") or [], ensure_ascii=False)
    for key, value in data.items():
        setattr(rule, key, value)
    db.commit()
    db.refresh(rule)
    return _rule_to_out(rule)


@router.delete("/data-permissions/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_permission(
    rule_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:
    rule = db.get(DataPermissionRule, rule_id)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()
