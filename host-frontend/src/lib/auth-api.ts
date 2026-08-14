import { apiRequest } from "./api";
import type {
  CurrentUserResponse,
  DataPermissionRule,
  DataPermissionRuleCreate,
  MenuCreatePayload,
  MenuItem,
  ReportMeta,
  Role,
  User,
} from "../types";

export function loginApi(username: string, password: string) {
  return apiRequest<{ access_token: string; token_type: string }>("/api/auth/login", {
    method: "POST",
    body: { username, password },
    auth: false,
  });
}

export function fetchCurrentUser() {
  return apiRequest<CurrentUserResponse>("/api/auth/current-user");
}

export function listMenusApi() {
  return apiRequest<MenuItem[]>("/api/admin/menus");
}

export function createMenuApi(payload: MenuCreatePayload) {
  return apiRequest<MenuItem>("/api/admin/menus", {
    method: "POST",
    body: payload,
  });
}

export function deleteMenuApi(id: number) {
  return apiRequest<void>(`/api/admin/menus/${id}`, {
    method: "DELETE",
  });
}

export function listRolesApi() {
  return apiRequest<Role[]>("/api/admin/roles");
}

export function listUsersApi() {
  return apiRequest<User[]>("/api/admin/users");
}

export function listReportMetasApi() {
  return apiRequest<ReportMeta[]>("/api/admin/report-metas");
}

export function syncReportMetaApi(reportCode: string) {
  return apiRequest<ReportMeta>(`/api/admin/report-metas/${encodeURIComponent(reportCode)}/sync`, {
    method: "POST",
  });
}

export function listDataPermissionsApi(params?: {
  subject_type?: string;
  subject_id?: number;
  report_code?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.subject_type) qs.set("subject_type", params.subject_type);
  if (params?.subject_id != null) qs.set("subject_id", String(params.subject_id));
  if (params?.report_code) qs.set("report_code", params.report_code);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiRequest<DataPermissionRule[]>(`/api/admin/data-permissions${suffix}`);
}

export function createDataPermissionApi(payload: DataPermissionRuleCreate) {
  return apiRequest<DataPermissionRule>("/api/admin/data-permissions", {
    method: "POST",
    body: payload,
  });
}

export function deleteDataPermissionApi(id: number) {
  return apiRequest<void>(`/api/admin/data-permissions/${id}`, {
    method: "DELETE",
  });
}
