import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { listMenusApi, listReportMetasApi, syncReportMetaApi } from "../lib/auth-api";
import type { MenuItem, ReportMeta } from "../types";

export default function ReportMetaPage() {
  const { isAdmin } = useAuth();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [metas, setMetas] = useState<ReportMeta[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [menuList, metaList] = await Promise.all([listMenusApi(), listReportMetasApi()]);
      setMenus(menuList);
      setMetas(metaList);
      setSelected((prev) => prev || (menuList[0]?.report_code ?? ""));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load().catch(() => undefined);
  }, [isAdmin, load]);

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        仅管理员可访问报表元数据。
      </div>
    );
  }

  const meta = metas.find((m) => m.report_code === selected) ?? null;
  const menu = menus.find((m) => m.report_code === selected) ?? null;

  async function handleSync() {
    if (!selected) return;
    setSyncing(true);
    setError(null);
    try {
      const updated = await syncReportMetaApi(selected);
      setMetas((prev) => {
        const others = prev.filter((m) => m.report_code !== selected);
        return [...others, updated].sort((a, b) => a.report_code.localeCompare(b.report_code));
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "同步失败");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">报表元数据</h2>
            <p className="mt-1 text-xs text-slate-500">
              从子报表 `GET /api/meta` 同步可过滤字段，供数据权限配置使用。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {menus.map((m) => (
                <option key={m.report_code} value={m.report_code}>
                  {m.title} ({m.report_code})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selected || syncing}
              onClick={() => handleSync()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-700 px-3 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              同步元数据
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
      </section>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中…
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-800">{menu?.title ?? selected}</h3>
              <p className="text-xs text-slate-400">
                backend: {menu?.backend_url ?? "-"} · synced: {meta?.synced_at ?? "尚未同步"}
              </p>
            </div>
          </div>

          {!meta ? (
            <p className="text-sm text-slate-500">暂无缓存元数据，请先点击「同步元数据」。</p>
          ) : meta.filterable_fields.length === 0 ? (
            <p className="text-sm text-slate-500">该报表未声明 filterable_fields。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-2">字段</th>
                    <th className="px-2 py-2">标签</th>
                    <th className="px-2 py-2">操作符</th>
                    <th className="px-2 py-2">枚举值</th>
                    <th className="px-2 py-2">必填</th>
                  </tr>
                </thead>
                <tbody>
                  {meta.filterable_fields.map((f) => (
                    <tr key={f.field_key} className="border-b border-slate-100 align-top">
                      <td className="px-2 py-3 font-mono text-xs">{f.field_key}</td>
                      <td className="px-2 py-3">{f.label}</td>
                      <td className="px-2 py-3 text-xs text-slate-600">{f.operators.join(", ")}</td>
                      <td className="px-2 py-3 text-xs text-slate-600">
                        {f.values.length ? f.values.join("、") : f.values_api || "-"}
                      </td>
                      <td className="px-2 py-3 text-xs">{f.required ? "是" : "否"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
