import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import {
  createDataPermissionApi,
  deleteDataPermissionApi,
  listDataPermissionsApi,
  listMenusApi,
  listReportMetasApi,
  listRolesApi,
  listUsersApi,
} from "../lib/auth-api";
import type {
  DataPermissionRule,
  FilterableField,
  MenuItem,
  ReportMeta,
  Role,
  User,
} from "../types";

type SubjectTab = "role" | "user";

export default function DataPermissionPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<SubjectTab>("role");
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [metas, setMetas] = useState<ReportMeta[]>([]);
  const [rules, setRules] = useState<DataPermissionRule[]>([]);

  const [subjectId, setSubjectId] = useState<number | "">("");
  const [reportCode, setReportCode] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [operator, setOperator] = useState<"in" | "eq">("in");
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBase = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roleList, userList, menuList, metaList] = await Promise.all([
        listRolesApi(),
        listUsersApi(),
        listMenusApi(),
        listReportMetasApi(),
      ]);
      setRoles(roleList);
      setUsers(userList);
      setMenus(menuList);
      setMetas(metaList);
      setSubjectId((prev) => (prev === "" && roleList.length ? roleList[0].id : prev));
      setReportCode((prev) => (prev === "" && menuList.length ? menuList[0].report_code : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);
  const loadRules = useCallback(async () => {
    if (subjectId === "") return;
    try {
      const data = await listDataPermissionsApi({
        subject_type: tab,
        subject_id: Number(subjectId),
      });
      setRules(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载规则失败");
    }
  }, [subjectId, tab]);

  useEffect(() => {
    if (isAdmin) loadBase().catch(() => undefined);
  }, [isAdmin, loadBase]);

  useEffect(() => {
    if (isAdmin && subjectId !== "") loadRules().catch(() => undefined);
  }, [isAdmin, subjectId, tab, loadRules]);

  useEffect(() => {
    // reset subject when switching tab
    if (tab === "role" && roles.length) setSubjectId(roles[0].id);
    if (tab === "user" && users.length) setSubjectId(users[0].id);
  }, [tab, roles, users]);

  const fields: FilterableField[] = useMemo(() => {
    const meta = metas.find((m) => m.report_code === reportCode);
    return meta?.filterable_fields ?? [];
  }, [metas, reportCode]);

  useEffect(() => {
    if (fields.length) {
      setFieldKey(fields[0].field_key);
      setSelectedValues([]);
    } else {
      setFieldKey("");
      setSelectedValues([]);
    }
  }, [fields]);

  const currentField = fields.find((f) => f.field_key === fieldKey);

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        仅管理员可配置数据权限。
      </div>
    );
  }

  function toggleValue(v: string) {
    setSelectedValues((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (subjectId === "" || !reportCode || !fieldKey || selectedValues.length === 0) {
      setError("请完整填写主体、报表、字段与允许值");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createDataPermissionApi({
        subject_type: tab,
        subject_id: Number(subjectId),
        report_code: reportCode,
        field_key: fieldKey,
        operator,
        values: selectedValues,
      });
      setSelectedValues([]);
      await loadRules();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "创建失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("确认删除该规则？")) return;
    try {
      await deleteDataPermissionApi(id);
      await loadRules();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "删除失败");
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-5">
      <section className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => setTab("role")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === "role" ? "bg-sky-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              按角色
            </button>
            <button
              type="button"
              onClick={() => setTab("user")}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === "user" ? "bg-sky-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              按用户
            </button>
          </div>

          <label className="block text-xs font-medium text-slate-600">
            {tab === "role" ? "角色" : "用户"}
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={subjectId}
              onChange={(e) => setSubjectId(Number(e.target.value))}
            >
              {tab === "role"
                ? roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.role_name} ({r.role_key})
                    </option>
                  ))
                : users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} / {u.role.role_key}
                    </option>
                  ))}
            </select>
          </label>
          <p className="mt-2 text-[11px] text-slate-400">
            合并语义：用户规则 ∩ 角色规则（用户只能更严）。
          </p>
        </div>

        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h3 className="flex items-center gap-1 text-sm font-semibold text-slate-800">
            <Plus className="h-4 w-4 text-sky-600" />
            新增规则
          </h3>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <label className="block text-xs font-medium text-slate-600">
            报表
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={reportCode}
              onChange={(e) => setReportCode(e.target.value)}
            >
              {menus.map((m) => (
                <option key={m.report_code} value={m.report_code}>
                  {m.title}
                </option>
              ))}
              <option value="*">* 全局</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-600">
            字段（来自元数据）
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={fieldKey}
              onChange={(e) => setFieldKey(e.target.value)}
              disabled={fields.length === 0 && reportCode !== "*"}
            >
              {fields.map((f) => (
                <option key={f.field_key} value={f.field_key}>
                  {f.label} ({f.field_key})
                </option>
              ))}
              {reportCode === "*" && (
                <>
                  <option value="dept">dept</option>
                  <option value="region">region</option>
                </>
              )}
            </select>
          </label>
          {fields.length === 0 && reportCode !== "*" && (
            <p className="text-[11px] text-amber-600">请先在「报表元数据」页同步该报表字段。</p>
          )}

          <label className="block text-xs font-medium text-slate-600">
            操作符
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={operator}
              onChange={(e) => setOperator(e.target.value as "in" | "eq")}
            >
              <option value="in">in</option>
              <option value="eq">eq</option>
            </select>
          </label>

          <div>
            <p className="text-xs font-medium text-slate-600">允许值</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(currentField?.values?.length
                ? currentField.values
                : ["华东区", "华北区", "华南区", "西南区"]
              ).map((v) => (
                <label
                  key={v}
                  className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs ${
                    selectedValues.includes(v)
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedValues.includes(v)}
                    onChange={() => toggleValue(v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            保存规则
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-3">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">已配置规则</h3>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中…
          </div>
        ) : rules.length === 0 ? (
          <p className="text-sm text-slate-500">当前主体暂无规则。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2">报表</th>
                  <th className="px-2 py-2">字段</th>
                  <th className="px-2 py-2">条件</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 align-top">
                    <td className="px-2 py-3 font-mono text-xs">{r.report_code}</td>
                    <td className="px-2 py-3 text-xs">{r.field_key}</td>
                    <td className="px-2 py-3 text-xs text-slate-600">
                      {r.operator} [{r.values.join(", ")}]
                    </td>
                    <td className="px-2 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
