from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.auth import create_access_token, verify_password
from app.database import get_db
from app.deps import get_current_user
from app.models import Menu, RoleMenu, User
from app.schemas import CurrentUserResponse, LoginRequest, MenuOut, TokenResponse, UserOut
from app.scope import resolve_data_scope

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(
        select(User).options(joinedload(User.role)).where(User.username == payload.username)
    )
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    token = create_access_token(
        user_id=user.id,
        username=user.username,
        role_key=user.role.role_key,
        dept_code=user.dept_code,
    )
    return TokenResponse(access_token=token)


@router.get("/current-user", response_model=CurrentUserResponse)
def current_user(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CurrentUserResponse:
    menus = _menus_for_role(db, user.role_id)
    data_scope = resolve_data_scope(role_key=user.role.role_key, dept_code=user.dept_code)
    return CurrentUserResponse(
        user=UserOut.model_validate(user),
        menus=[MenuOut.model_validate(m) for m in menus],
        data_scope=data_scope,
    )


def _menus_for_role(db: Session, role_id: int) -> list[Menu]:
    stmt = (
        select(Menu)
        .join(RoleMenu, RoleMenu.menu_id == Menu.id)
        .where(RoleMenu.role_id == role_id, Menu.is_active.is_(True))
        .order_by(Menu.sort_order.asc(), Menu.id.asc())
    )
    return list(db.scalars(stmt).all())
