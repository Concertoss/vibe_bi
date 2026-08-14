"""Seed default roles / admin user / sample report menus."""

from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.core.config import settings
from app.models import DataPermissionRule, Menu, ReportMeta, Role, RoleMenu, User


def seed_if_empty(db: Session) -> None:
    if db.scalar(select(Role).limit(1)):
        return

    admin_role = Role(role_name="管理员", role_key="admin")
    viewer_role = Role(role_name="访客", role_key="viewer")
    db.add_all([admin_role, viewer_role])
    db.flush()

    admin = User(
        username="admin",
        password_hash=hash_password("admin123"),
        role_id=admin_role.id,
        dept_code="HQ",
    )
    viewer = User(
        username="viewer",
        password_hash=hash_password("viewer123"),
        role_id=viewer_role.id,
        dept_code="EAST",
    )
    db.add_all([admin, viewer])
    db.flush()

    component_url = settings.seed_template_component_url
    backend_url = settings.seed_template_backend_url

    menus = [
        Menu(
            report_code="template-report",
            title="模板报表",
            path="/reports/template",
            component_url=component_url,
            backend_url=backend_url,
            visible_roles="admin,viewer",
            sort_order=10,
        ),
        Menu(
            report_code="sales-demo",
            title="销售演示报表",
            path="/reports/sales-demo",
            component_url=component_url,
            backend_url=backend_url,
            visible_roles="admin",
            sort_order=20,
        ),
    ]
    db.add_all(menus)
    db.flush()

    for menu in menus:
        keys = [k.strip() for k in (menu.visible_roles or "").split(",") if k.strip()]
        for role in (admin_role, viewer_role):
            if role.role_key in keys:
                db.add(RoleMenu(role_id=role.id, menu_id=menu.id))

    db.commit()


def seed_data_permissions_if_empty(db: Session) -> None:
    """Seed sample meta + role/user rules when tables are empty (idempotent)."""
    if db.scalar(select(DataPermissionRule).limit(1)):
        return

    viewer = db.scalar(select(Role).where(Role.role_key == "viewer"))
    viewer_user = db.scalar(select(User).where(User.username == "viewer"))
    if viewer is None:
        return

    if db.scalar(select(ReportMeta).where(ReportMeta.report_code == "template-report")) is None:
        meta = {
            "report_code": "template-report",
            "title": "模板报表",
            "filterable_fields": [
                {
                    "field_key": "dept",
                    "label": "区域",
                    "value_type": "enum",
                    "operators": ["in", "eq"],
                    "value_source": "static",
                    "values": ["华东区", "华北区", "华南区", "西南区"],
                    "required": False,
                }
            ],
        }
        db.add(
            ReportMeta(
                report_code="template-report",
                title="模板报表",
                meta_json=json.dumps(meta, ensure_ascii=False),
            )
        )

    db.add(
        DataPermissionRule(
            subject_type="role",
            subject_id=viewer.id,
            report_code="template-report",
            field_key="dept",
            operator="in",
            values_json=json.dumps(["华东区"], ensure_ascii=False),
            effect="allow",
            priority=0,
        )
    )

    if viewer_user is not None:
        db.add(
            DataPermissionRule(
                subject_type="user",
                subject_id=viewer_user.id,
                report_code="template-report",
                field_key="dept",
                operator="in",
                values_json=json.dumps(["华东区"], ensure_ascii=False),
                effect="allow",
                priority=10,
            )
        )

    db.commit()
