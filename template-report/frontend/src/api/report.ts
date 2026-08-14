import { http } from "../lib/http";

export type KpiItem = {
  key: string;
  label: string;
  value: number;
  unit: string;
  mom: number;
  yoy: number;
};

export type ReportData = {
  identity: {
    user_id: string | null;
    role: string | null;
    data_scope: string[];
  };
  meta: {
    data_scope_header: string[];
    effective_scope: string[];
    sql_preview: string;
    sql_params: Record<string, string>;
    dimension: string;
  };
  kpis: KpiItem[];
  trend: {
    categories: string[];
    bar: { name: string; data: number[] };
    line: { name: string; data: number[] };
  };
  distribution: { name: string; value: number }[];
  table: {
    total: number;
    page: number;
    page_size: number;
    rows: {
      date: string;
      dept: string;
      sales: number;
      orders: number;
      customers: number;
    }[];
  };
};

export type ReportQuery = {
  start_date?: string;
  end_date?: string;
  dimension?: "date" | "dept";
  page?: number;
  page_size?: number;
};

export async function fetchReportData(query: ReportQuery): Promise<ReportData> {
  const { data } = await http.get<ReportData>("/api/report/data", { params: query });
  return data;
}
