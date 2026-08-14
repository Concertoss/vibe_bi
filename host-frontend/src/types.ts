export type Role = {
  id: number;
  role_name: string;
  role_key: string;
};

export type MenuItem = {
  id: number;
  report_code: string;
  title: string;
  path: string;
  component_url: string | null;
  backend_url: string | null;
  visible_roles: string | null;
  sort_order: number;
  is_active: boolean;
};

export type User = {
  id: number;
  username: string;
  role_id: number;
  dept_code: string;
  role: Role;
};

export type CurrentUserResponse = {
  user: User;
  menus: MenuItem[];
  data_scope: string[];
};

export type MenuCreatePayload = {
  report_code: string;
  title: string;
  path: string;
  component_url?: string | null;
  backend_url?: string | null;
  visible_roles?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type FilterableField = {
  field_key: string;
  label: string;
  value_type: string;
  operators: string[];
  value_source: string;
  values: string[];
  values_api?: string | null;
  required: boolean;
};

export type ReportMeta = {
  id: number;
  report_code: string;
  title: string;
  meta_json: Record<string, unknown>;
  filterable_fields: FilterableField[];
  synced_at: string | null;
};

export type DataPermissionRule = {
  id: number;
  subject_type: "role" | "user" | string;
  subject_id: number;
  report_code: string;
  field_key: string;
  operator: string;
  values: string[];
  effect: string;
  priority: number;
};

export type DataPermissionRuleCreate = {
  subject_type: "role" | "user";
  subject_id: number;
  report_code: string;
  field_key: string;
  operator: "in" | "eq";
  values: string[];
  effect?: string;
  priority?: number;
};
