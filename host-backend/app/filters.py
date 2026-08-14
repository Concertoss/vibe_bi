"""Resolve role/user data-permission rules into gateway X-Data-Filters."""

from __future__ import annotations

import json
from dataclasses import dataclass

from fastapi import HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.models import DataPermissionRule, Menu, ReportMeta, RoleMenu, User
from app.scope import resolve_data_scope

# Fields that also populate legacy X-Data-Scope
SCOPE_FIELD_KEYS = {"region", "dept", "区域"}


@dataclass
class DataFilter:
    field: str
    op: str
    values: list[str]

    def to_dict(self) -> dict:
        return {"field": self.field, "op": self.op, "values": self.values}


def _parse_values(raw: str) -> list[str]:
    try:
        data = json.loads(raw or "[]")
    except json.JSONDecodeError:
        return []
    if not isinstance(data, list):
        return []
    return [str(x) for x in data if str(x).strip()]


def _rule_to_filter(rule: DataPermissionRule) -> DataFilter:
    values = _parse_values(rule.values_json)
    op = rule.operator if rule.operator in {"in", "eq"} else "in"
    if op == "eq" and values:
        values = [values[0]]
    return DataFilter(field=rule.field_key, op=op, values=values)


def _merge_same_field(filters: list[DataFilter]) -> dict[str, DataFilter]:
    """Merge multiple rules on the same field with intersection of values."""
    by_field: dict[str, DataFilter] = {}
    for f in filters:
        if f.field not in by_field:
            by_field[f.field] = DataFilter(field=f.field, op=f.op, values=list(f.values))
            continue
        existing = by_field[f.field]
        # Prefer in; intersection of value sets
        inter = sorted(set(existing.values) & set(f.values))
        by_field[f.field] = DataFilter(field=f.field, op="in", values=inter)
    return by_field


def _intersect_role_user(
    role_map: dict[str, DataFilter],
    user_map: dict[str, DataFilter],
) -> list[DataFilter]:
    """User can only narrow role rules: intersection when both exist."""
    fields = set(role_map) | set(user_map)
    out: list[DataFilter] = []
    for field in sorted(fields):
        r = role_map.get(field)
        u = user_map.get(field)
        if r and u:
            inter = sorted(set(r.values) & set(u.values))
            out.append(DataFilter(field=field, op="in", values=inter))
        elif r:
            out.append(r)
        elif u:
            out.append(u)
    return out


def load_required_fields(db: Session, report_code: str) -> list[str]:
    meta = db.scalar(select(ReportMeta).where(ReportMeta.report_code == report_code))
    if meta is None:
        return []
    try:
        payload = json.loads(meta.meta_json or "{}")
    except json.JSONDecodeError:
        return []
    fields = payload.get("filterable_fields") or []
    required: list[str] = []
    for f in fields:
        if isinstance(f, dict) and f.get("required") is True and f.get("field_key"):
            required.append(str(f["field_key"]))
    return required


def user_has_report_menu_access(db: Session, user: User, report_code: str) -> bool:
    if user.role.role_key == "admin":
        return True
    menu = db.scalar(select(Menu).where(Menu.report_code == report_code, Menu.is_active.is_(True)))
    if menu is None:
        return False
    link = db.scalar(
        select(RoleMenu).where(RoleMenu.role_id == user.role_id, RoleMenu.menu_id == menu.id)
    )
    return link is not None


def resolve_filters_for_user(
    db: Session,
    *,
    user: User,
    report_code: str,
) -> tuple[list[DataFilter], list[str]]:
    """Return (filters, data_scope_compat).

    Raises HTTP 403 when a required meta field has no effective rule / empty values.
    """
    rules = list(
        db.scalars(
            select(DataPermissionRule).where(
                DataPermissionRule.report_code.in_([report_code, "*"]),
                or_(
                    and_(
                        DataPermissionRule.subject_type == "role",
                        DataPermissionRule.subject_id == user.role_id,
                    ),
                    and_(
                        DataPermissionRule.subject_type == "user",
                        DataPermissionRule.subject_id == user.id,
                    ),
                ),
            )
        ).all()
    )

    role_filters = [_rule_to_filter(r) for r in rules if r.subject_type == "role"]
    user_filters = [_rule_to_filter(r) for r in rules if r.subject_type == "user"]
    merged = _intersect_role_user(
        _merge_same_field(role_filters),
        _merge_same_field(user_filters),
    )

    # Required fields from cached meta
    for field_key in load_required_fields(db, report_code):
        match = next((f for f in merged if f.field == field_key), None)
        if match is None or not match.values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required data permission for field '{field_key}'",
            )

    # Empty intersection after user∩role is also deny
    for f in merged:
        if not f.values:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Data permission for field '{f.field}' resolved to empty set",
            )

    # Legacy X-Data-Scope: prefer filter values; else dept_code map
    scope: list[str] = []
    for f in merged:
        if f.field in SCOPE_FIELD_KEYS and f.op in {"in", "eq"}:
            scope = list(f.values)
            break
    if not scope:
        scope = resolve_data_scope(role_key=user.role.role_key, dept_code=user.dept_code)

    return merged, scope
