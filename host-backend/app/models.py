from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_name: Mapped[str] = mapped_column(String(64), nullable=False)
    role_key: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)

    users: Mapped[list["User"]] = relationship(back_populates="role")
    role_menus: Mapped[list["RoleMenu"]] = relationship(
        back_populates="role",
        cascade="all, delete-orphan",
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    dept_code: Mapped[str] = mapped_column(String(64), nullable=False, default="HQ")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    role: Mapped["Role"] = relationship(back_populates="users")


class Menu(Base):
    __tablename__ = "menus"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    path: Mapped[str] = mapped_column(String(255), nullable=False)
    component_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    backend_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    visible_roles: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    role_menus: Mapped[list["RoleMenu"]] = relationship(
        back_populates="menu",
        cascade="all, delete-orphan",
    )


class RoleMenu(Base):
    __tablename__ = "role_menus"
    __table_args__ = (UniqueConstraint("role_id", "menu_id", name="uq_role_menu"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    menu_id: Mapped[int] = mapped_column(ForeignKey("menus.id", ondelete="CASCADE"), nullable=False)

    role: Mapped["Role"] = relationship(back_populates="role_menus")
    menu: Mapped["Menu"] = relationship(back_populates="role_menus")


class ReportMeta(Base):
    """Cached /api/meta payload from a sub-report service."""

    __tablename__ = "report_metas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    report_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    meta_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    synced_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())


class DataPermissionRule(Base):
    """Row-level data permission configured in the Host."""

    __tablename__ = "data_permission_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    subject_type: Mapped[str] = mapped_column(String(16), nullable=False, index=True)  # role | user
    subject_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    report_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)  # or *
    field_key: Mapped[str] = mapped_column(String(64), nullable=False)
    operator: Mapped[str] = mapped_column(String(16), nullable=False, default="in")  # in | eq
    values_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    effect: Mapped[str] = mapped_column(String(16), nullable=False, default="allow")
    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
