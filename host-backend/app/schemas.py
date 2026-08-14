from pydantic import BaseModel, Field


# ----- Auth -----


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RoleOut(BaseModel):
    id: int
    role_name: str
    role_key: str

    model_config = {"from_attributes": True}


class MenuOut(BaseModel):
    id: int
    report_code: str
    title: str
    path: str
    component_url: str | None = None
    backend_url: str | None = None
    visible_roles: str | None = None
    sort_order: int = 0
    is_active: bool = True

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: int
    username: str
    role_id: int
    dept_code: str
    role: RoleOut

    model_config = {"from_attributes": True}


class CurrentUserResponse(BaseModel):
    user: UserOut
    menus: list[MenuOut]
    data_scope: list[str]


# ----- Admin Menus -----


class MenuCreate(BaseModel):
    report_code: str = Field(..., min_length=1, max_length=64)
    title: str = Field(..., min_length=1, max_length=128)
    path: str = Field(..., min_length=1, max_length=255)
    component_url: str | None = None
    backend_url: str | None = None
    visible_roles: str | None = Field(
        default=None,
        description="Comma-separated role_key list, e.g. admin,viewer",
    )
    sort_order: int = 0
    is_active: bool = True
    role_ids: list[int] | None = Field(
        default=None,
        description="Role IDs to bind via RoleMenu; if omitted, sync from visible_roles",
    )


class MenuUpdate(BaseModel):
    report_code: str | None = None
    title: str | None = None
    path: str | None = None
    component_url: str | None = None
    backend_url: str | None = None
    visible_roles: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None
    role_ids: list[int] | None = None


# ----- Report meta & data permissions -----


class FilterableFieldOut(BaseModel):
    field_key: str
    label: str
    value_type: str = "enum"
    operators: list[str] = Field(default_factory=lambda: ["in", "eq"])
    value_source: str = "static"
    values: list[str] = Field(default_factory=list)
    values_api: str | None = None
    required: bool = False


class ReportMetaOut(BaseModel):
    id: int
    report_code: str
    title: str
    meta_json: dict
    filterable_fields: list[FilterableFieldOut] = Field(default_factory=list)
    synced_at: str | None = None

    model_config = {"from_attributes": True}


class DataPermissionRuleCreate(BaseModel):
    subject_type: str = Field(..., pattern="^(role|user)$")
    subject_id: int
    report_code: str = Field(..., min_length=1, max_length=64)
    field_key: str = Field(..., min_length=1, max_length=64)
    operator: str = Field(default="in", pattern="^(in|eq)$")
    values: list[str] = Field(default_factory=list)
    effect: str = "allow"
    priority: int = 0


class DataPermissionRuleUpdate(BaseModel):
    field_key: str | None = None
    operator: str | None = Field(default=None, pattern="^(in|eq)$")
    values: list[str] | None = None
    effect: str | None = None
    priority: int | None = None
    report_code: str | None = None


class DataPermissionRuleOut(BaseModel):
    id: int
    subject_type: str
    subject_id: int
    report_code: str
    field_key: str
    operator: str
    values: list[str]
    effect: str
    priority: int

    model_config = {"from_attributes": True}
