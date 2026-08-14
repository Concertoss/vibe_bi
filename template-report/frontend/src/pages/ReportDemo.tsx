import { useCallback, useEffect, useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import { fetchReportData, type ReportData } from "../api/report";
import BaseChart from "../components/charts/BaseChart";
import { ReportSkeleton } from "../components/Skeleton";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function formatNumber(n: number) {
  return n.toLocaleString("zh-CN");
}

function formatPct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${(n * 100).toFixed(1)}%`;
}

export default function ReportDemo() {
  const [startDate, setStartDate] = useState(() => daysAgoISO(13));
  const [endDate, setEndDate] = useState(() => todayISO());
  const [dimension, setDimension] = useState<"date" | "dept">("date");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchReportData({
        start_date: startDate,
        end_date: endDate,
        dimension,
        page,
        page_size: pageSize,
      });
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, dimension, page]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const trendOption: EChartsOption = useMemo(() => {
    if (!data) return {};
    return {
      tooltip: { trigger: "axis" },
      legend: { data: [data.trend.bar.name, data.trend.line.name] },
      grid: { left: 48, right: 48, top: 40, bottom: 32 },
      xAxis: {
        type: "category",
        data: data.trend.categories,
        axisLabel: { hideOverlap: true },
      },
      yAxis: [
        { type: "value", name: data.trend.bar.name },
        { type: "value", name: data.trend.line.name },
      ],
      series: [
        {
          name: data.trend.bar.name,
          type: "bar",
          data: data.trend.bar.data,
          itemStyle: { color: "#0ea5e9", borderRadius: [4, 4, 0, 0] },
        },
        {
          name: data.trend.line.name,
          type: "line",
          yAxisIndex: 1,
          smooth: true,
          data: data.trend.line.data,
          itemStyle: { color: "#f59e0b" },
        },
      ],
    };
  }, [data]);

  const pieOption: EChartsOption = useMemo(() => {
    if (!data) return {};
    return {
      tooltip: { trigger: "item" },
      legend: { bottom: 0, type: "scroll" },
      series: [
        {
          type: "pie",
          radius: ["42%", "68%"],
          center: ["50%", "46%"],
          data: data.distribution,
          label: { formatter: "{b}\n{d}%" },
        },
      ],
    };
  }, [data]);

  const totalPages = data ? Math.max(1, Math.ceil(data.table.total / pageSize)) : 1;

  if (loading && !data) {
    return <ReportSkeleton />;
  }

  return (
    <div className="min-h-full bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-4 p-4 md:space-y-5 md:p-6">
        {/* Filters */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">标准报表示例</h1>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">
                数据范围由 Gateway 注入的 X-Data-Scope 过滤
                {data?.meta.effective_scope?.length
                  ? ` · ${data.meta.effective_scope.join("、")}`
                  : ""}
                {data?.identity.user_id ? ` · user=${data.identity.user_id}` : " · 本地独立调试"}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="block text-xs font-medium text-slate-600">
                开始日期
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={startDate}
                  onChange={(e) => {
                    setPage(1);
                    setStartDate(e.target.value);
                  }}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                结束日期
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={endDate}
                  onChange={(e) => {
                    setPage(1);
                    setEndDate(e.target.value);
                  }}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                维度切换
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={dimension}
                  onChange={(e) => {
                    setPage(1);
                    setDimension(e.target.value as "date" | "dept");
                  }}
                >
                  <option value="date">按日期</option>
                  <option value="dept">按大区</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPI cards */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.kpis ?? []).map((kpi) => (
            <article
              key={kpi.key}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {formatNumber(kpi.value)}
                <span className="ml-1 text-sm font-normal text-slate-400">{kpi.unit}</span>
              </p>
              <div className="mt-3 flex gap-4 text-xs">
                <span className={kpi.mom >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  环比 {formatPct(kpi.mom)}
                </span>
                <span className={kpi.yoy >= 0 ? "text-emerald-600" : "text-rose-600"}>
                  同比 {formatPct(kpi.yoy)}
                </span>
              </div>
            </article>
          ))}
          {loading && !data?.kpis?.length && (
            <>
              <div className="h-28 animate-pulse rounded-2xl bg-slate-200/80" />
              <div className="h-28 animate-pulse rounded-2xl bg-slate-200/80" />
              <div className="h-28 animate-pulse rounded-2xl bg-slate-200/80" />
            </>
          )}
        </section>

        {/* Charts */}
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-3">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">趋势分析</h2>
            <BaseChart option={trendOption} loading={loading} height={320} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
            <h2 className="mb-2 text-sm font-semibold text-slate-800">销售分布</h2>
            <BaseChart option={pieOption} loading={loading} height={320} />
          </div>
        </section>

        {/* Table */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">明细数据</h2>
            <p className="text-xs text-slate-400">
              共 {data?.table.total ?? 0} 条 · 第 {page}/{totalPages} 页
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-medium">日期</th>
                  <th className="px-2 py-2 font-medium">大区</th>
                  <th className="px-2 py-2 font-medium">销售额</th>
                  <th className="px-2 py-2 font-medium">订单</th>
                  <th className="px-2 py-2 font-medium">客户</th>
                </tr>
              </thead>
              <tbody>
                {(data?.table.rows ?? []).map((row, idx) => (
                  <tr key={`${row.date}-${row.dept}-${idx}`} className="border-b border-slate-100">
                    <td className="px-2 py-2.5 text-slate-700">{row.date}</td>
                    <td className="px-2 py-2.5">{row.dept}</td>
                    <td className="px-2 py-2.5">{formatNumber(row.sales)}</td>
                    <td className="px-2 py-2.5">{formatNumber(row.orders)}</td>
                    <td className="px-2 py-2.5">{formatNumber(row.customers)}</td>
                  </tr>
                ))}
                {!loading && (data?.table.rows.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-8 text-center text-slate-400">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40"
            >
              上一页
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs disabled:opacity-40"
            >
              下一页
            </button>
          </div>
        </section>

        {data?.meta.sql_preview && (
          <details className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-500">
            <summary className="cursor-pointer font-medium text-slate-700">
              SQL 预览（演示 X-Data-Scope → WHERE dept IN）
            </summary>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-900 p-3 text-[11px] text-slate-100">
              {data.meta.sql_preview}
              {"\n\n-- params: "}
              {JSON.stringify(data.meta.sql_params, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
