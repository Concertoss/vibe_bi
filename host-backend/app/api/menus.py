from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_admin
from app.models import Menu, Role, RoleMenu, User
from app.schemas import MenuCreate, MenuOut, MenuUpdate

router = APIRouter(prefix="/admin/menus", tags=["admin-menus"])


def _parse_role_keys(visible_roles: str | None) -> list[str]:
    if not visible_roles:
        return []
    return [p.strip() for p in visible_roles.split(",") if p.strip()]


def _resolve_role_ids(
    db: Session,
    *,
    role_ids: list[int] | None,
    visible_roles: str | None,
) -> list[int]:
    if role_ids is not None:
        return role_ids
    keys = _parse_role_keys(visible_roles)
    if not keys:
        return []
    roles = list(db.scalars(select(Role).where(Role.role_key.in_(keys))).all())
    return [r.id for r in roles]


def _sync_role_menus(db: Session, menu_id: int, role_ids: list[int]) -> None:
    db.execute(delete(RoleMenu).where(RoleMenu.menu_id == menu_id))
    for rid in role_ids:
        db.add(RoleMenu(role_id=rid, menu_id=menu_id))


@router.get("", response_model=list[MenuOut])
def list_menus(
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> list[Menu]:
    return list(db.scalars(select(Menu).order_by(Menu.sort_order.asc(), Menu.id.asc())).all())


@router.get("/{menu_id}", response_model=MenuOut)
def get_menu(
    menu_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Menu:
    menu = db.get(Menu, menu_id)
    if menu is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    return menu


@router.post("", response_model=MenuOut, status_code=status.HTTP_201_CREATED)
def create_menu(
    payload: MenuCreate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Menu:
    exists = db.scalar(select(Menu).where(Menu.report_code == payload.report_code))
    if exists:
        raise HTTPException(status_code=400, detail="report_code already exists")

    menu = Menu(
        report_code=payload.report_code,
        title=payload.title,
        path=payload.path,
        component_url=payload.component_url,
        backend_url=payload.backend_url,
        visible_roles=payload.visible_roles,
        sort_order=payload.sort_order,
        is_active=payload.is_active,
    )
    db.add(menu)
    db.flush()

    role_ids = _resolve_role_ids(
        db, role_ids=payload.role_ids, visible_roles=payload.visible_roles
    )
    _sync_role_menus(db, menu.id, role_ids)
    db.commit()
    db.refresh(menu)
    return menu


@router.put("/{menu_id}", response_model=MenuOut)
def update_menu(
    menu_id: int,
    payload: MenuUpdate,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Menu:
    menu = db.get(Menu, menu_id)
    if menu is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")

    data = payload.model_dump(exclude_unset=True)
    role_ids = data.pop("role_ids", None)
    sync_roles = role_ids is not None or "visible_roles" in data

    if "report_code" in data and data["report_code"] != menu.report_code:
        clash = db.scalar(
            select(Menu).where(Menu.report_code == data["report_code"], Menu.id != menu_id)
        )
        if clash:
            raise HTTPException(status_code=400, detail="report_code already exists")

    for key, value in data.items():
        setattr(menu, key, value)

    if sync_roles:
        resolved = _resolve_role_ids(
            db,
            role_ids=role_ids,
            visible_roles=None if role_ids is not None else menu.visible_roles,
        )
        _sync_role_menus(db, menu.id, resolved)

    db.commit()
    db.refresh(menu)
    return menu


@router.delete("/{menu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_menu(
    menu_id: int,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> None:
    menu = db.get(Menu, menu_id)
    if menu is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu not found")
    db.delete(menu)
    db.commit()
