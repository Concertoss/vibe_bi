import { FormEvent, useCallback, useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { createMenuApi, deleteMenuApi, listMenusApi, syncReportMetaApi } from "../lib/auth-api";
import type { MenuItem } from "../types";

type FormState = {
  title: string;
  report_code: string;
  path: string;
  component_url: string;
  backend_url: string;
  visible_roles: string;
};

type FormErrors = Partial<Record<keyof FormState, string>> & { form?: string };

const EMPTY: FormState = {
  title: "",
  report_code: "",
  path: "",
  component_url: "http://localhost:5174",
  backend_url: "http://localhost:8001",
  visible_roles: "admin,viewer",
};

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_]/g, "")
    .slice(0, 48);
}

export default function MenuManager() {
  const { isAdmin, refresh } = useAuth();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingCode, setSyncingCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listMenusApi();
      setMenus(data);
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : "加载菜单失败",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      load().catch(() => undefined);
    }
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        仅管理员可访问菜单管理。
      </div>
    );
  }

  function validate(values: FormState): FormErrors {
    const next: FormErrors = {};
    if (!values.title.trim()) next.title = "请输入报表名称";
    if (!values.report_code.trim()) next.report_code = "请输入 report_code";
    else if (!/^[a-zA-Z0-9_-]+$/.test(values.report_code.trim())) {
      next.report_code = "仅允许字母、数字、下划线、中划线";
    }
    if (!values.path.trim()) next.path = "请输入前端路由 path";
    else if (!values.path.startsWith("/")) next.path = "path 需以 / 开头";
    if (!values.component_url.trim()) next.component_url = "请输入前端入口 URL";
    else if (!/^https?:\/\//.test(values.component_url.trim())) {
      next.component_url = "需为 http(s) 地址";
    }
    if (!values.backend_url.trim()) next.backend_url = "请输入后端目标 URL";
    else if (!/^https?:\/\//.test(values.backend_url.trim())) {
      next.backend_url = "需为 http(s) 地址";
    }
    if (!values.visible_roles.trim()) next.visible_roles = "请输入可见角色，如 admin,viewer";
    return next;
  }

  function updateField<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      // Auto-fill report_code / path from title when still empty or derived
      if (key === "title") {
        const code = slugify(value) || prev.report_code;
        if (!prev.report_code || prev.report_code === slugify(prev.title)) {
          next.report_code = code;
        }
        if (!prev.path || prev.path === `/reports/${slugify(prev.title)}`) {
          next.path = code ? `/reports/${code}` : prev.path;
        }
      }
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await createMenuApi({
        title: form.title.trim(),
        report_code: form.report_code.trim(),
        path: form.path.trim(),
        component_url: form.component_url.trim(),
        backend_url: form.backend_url.trim(),
        visible_roles: form.visible_roles.trim(),
      });
      setForm(EMPTY);
      setErrors({});
      await load();
      await refresh().catch(() => undefined);
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : "创建失败",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("确认删除该菜单？")) return;
    try {
      await deleteMenuApi(id);
      await load();
      await refresh().catch(() => undefined);
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : "删除失败",
      });
    }
  }

  async function handleSyncMeta(reportCode: string) {
    setSyncingCode(reportCode);
    setErrors({});
    try {
      await syncReportMetaApi(reportCode);
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : "同步元数据失败（请确认子报表已启动）",
      });
    } finally {
      setSyncingCode(null);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Plus className="h-4 w-4 text-sky-600" />
          新增报表菜单
        </h2>

        {errors.form && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.form}
          </div>
        )}

        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <Field
            label="报表名称"
            error={errors.title}
            value={form.title}
            onChange={(v) => updateField("title", v)}
            placeholder="销售看板"
          />
          <Field
            label="report_code（代理路由标识）"
            error={errors.report_code}
            value={form.report_code}
            onChange={(v) => updateField("report_code", v)}
            placeholder="sales-board"
          />
          <Field
            label="前端路由 path"
            error={errors.path}
            value={form.path}
            onChange={(v) => updateField("path", v)}
            placeholder="/reports/sales-board"
          />
          <Field
            label="前端入口 URL（Wujie）"
            error={errors.component_url}
            value={form.component_url}
            onChange={(v) => updateField("component_url", v)}
            placeholder="http://localhost:5174"
          />
          <Field
            label="后端目标 URL（Gateway）"
            error={errors.backend_url}
            value={form.backend_url}
            onChange={(v) => updateField("backend_url", v)}
            placeholder="http://localhost:8001"
          />
          <Field
            label="可见角色（逗号分隔 role_key）"
            error={errors.visible_roles}
            value={form.visible_roles}
            onChange={(v) => updateField("visible_roles", v)}
            placeholder="admin,viewer"
          />

          <button
            type="submit"
            disabled={saving}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? "保存中…" : "创建菜单"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">已配置菜单</h2>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中…
          </div>
        ) : menus.length === 0 ? (
          <p className="text-sm text-slate-500">暂无菜单，请先新增。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-medium">名称</th>
                  <th className="px-2 py-2 font-medium">code</th>
                  <th className="px-2 py-2 font-medium">入口</th>
                  <th className="px-2 py-2 font-medium">角色</th>
                  <th className="px-2 py-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {menus.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100 align-top">
                    <td className="px-2 py-3">
                      <p className="font-medium text-slate-800">{m.title}</p>
                      <p className="text-xs text-slate-400">{m.path}</p>
                    </td>
                    <td className="px-2 py-3 font-mono text-xs text-slate-600">{m.report_code}</td>
                    <td className="px-2 py-3">
                      <p className="max-w-[180px] truncate text-xs text-slate-600" title={m.component_url ?? ""}>
                        {m.component_url}
                      </p>
                      <p className="max-w-[180px] truncate text-xs text-slate-400" title={m.backend_url ?? ""}>
                        {m.backend_url}
                      </p>
                    </td>
                    <td className="px-2 py-3 text-xs text-slate-600">{m.visible_roles}</td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleSyncMeta(m.report_code)}
                          disabled={syncingCode === m.report_code}
                          className="inline-flex items-center gap-1 rounded-md border border-sky-200 px-2 py-1 text-xs text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                        >
                          {syncingCode === m.report_code ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                          同步元数据
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          删除
                        </button>
                      </div>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <input
        className={`w-full rounded-lg border px-3 py-2 outline-none transition focus:ring-2 focus:ring-sky-200 ${
          error ? "border-red-400" : "border-slate-300 focus:border-sky-500"
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </label>
  );
}
