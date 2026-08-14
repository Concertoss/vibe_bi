"""In-memory demo dataset + scoped SQL-style filtering."""

from __future__ import annotations

from copy import deepcopy
from datetime import date, timedelta
from typing import Any

from app.deps import (
    assert_scope_or_demo,
    build_where_from_filters,
    scopes_from_filters,
)

ALL_DEPTS = ["华东区", "华北区", "华南区", "西南区"]
ALLOWED_FILTER_FIELDS = {"dept", "region"}

_DEMO_ROWS: list[dict] | None = None


def _seed_rows() -> list[dict]:
    global _DEMO_ROWS
    if _DEMO_ROWS is not None:
        return _DEMO_ROWS

    rows: list[dict] = []
    today = date.today()
    base = {
        "华东区": (120, 0.32),
        "华北区": (95, 0.28),
        "华南区": (110, 0.30),
        "西南区": (80, 0.25),
    }
    for offset in range(29, -1, -1):
        d = today - timedelta(days=offset)
        for dept, (sales_base, rate) in base.items():
            wobble = (offset * 3 + len(dept)) % 17
            sales = sales_base + wobble * 4
            orders = int(sales * rate) + (wobble % 5)
            rows.append(
                {
                    "date": d.isoformat(),
                    "dept": dept,
                    "sales": sales,
                    "orders": orders,
                    "customers": max(10, orders - 5 + (wobble % 7)),
                }
            )
    _DEMO_ROWS = rows
    return rows


def query_report_data(
    *,
    data_filters: list[dict[str, Any]],
    start_date: str | None,
    end_date: str | None,
    dimension: str,
    page: int,
    page_size: int,
) -> dict:
    """Apply X-Data-Filters (fallback scope) with parameterized WHERE dept IN (...)."""
    scope_from_filters = scopes_from_filters(data_filters, {"dept", "region"})
    effective_scope = assert_scope_or_demo(scope_from_filters, ALL_DEPTS)

    # Normalize region → dept for demo table column
    normalized_filters: list[dict[str, Any]] = []
    for f in data_filters:
        field = f.get("field")
        if field == "region":
            normalized_filters.append({**f, "field": "dept"})
        else:
            normalized_filters.append(f)
    if not normalized_filters and effective_scope:
        normalized_filters = [{"field": "dept", "op": "in", "values": effective_scope}]

    where_sql, params = build_where_from_filters(
        normalized_filters,
        allowed_fields=ALLOWED_FILTER_FIELDS | {"dept"},
    )

    sql_preview = (
        "SELECT date, dept, sales, orders, customers\n"
        "FROM demo_sales\n"
        f"WHERE {where_sql}"
    )
    if start_date:
        sql_preview += "\n  AND date >= :start_date"
        params = {**params, "start_date": start_date}
    if end_date:
        sql_preview += "\n  AND date <= :end_date"
        params = {**params, "end_date": end_date}

    rows = [
        r
        for r in _seed_rows()
        if r["dept"] in effective_scope
        and (not start_date or r["date"] >= start_date)
        and (not end_date or r["date"] <= end_date)
    ]

    sales = sum(r["sales"] for r in rows)
    orders = sum(r["orders"] for r in rows)
    customers = sum(r["customers"] for r in rows)

    kpis = [
        {
            "key": "sales",
            "label": "销售额",
            "value": sales,
            "unit": "元",
            "mom": 0.086,
            "yoy": 0.124,
        },
        {
            "key": "orders",
            "label": "订单量",
            "value": orders,
            "unit": "单",
            "mom": 0.042,
            "yoy": 0.091,
        },
        {
            "key": "customers",
            "label": "客户数",
            "value": customers,
            "unit": "人",
            "mom": -0.015,
            "yoy": 0.067,
        },
    ]

    if dimension == "dept":
        categories = sorted({r["dept"] for r in rows})
        bar = [sum(r["sales"] for r in rows if r["dept"] == c) for c in categories]
        line = [sum(r["orders"] for r in rows if r["dept"] == c) for c in categories]
    else:
        categories = sorted({r["date"] for r in rows})
        bar = [sum(r["sales"] for r in rows if r["date"] == c) for c in categories]
        line = [sum(r["orders"] for r in rows if r["date"] == c) for c in categories]

    pie = [
        {
            "name": dept,
            "value": sum(r["sales"] for r in rows if r["dept"] == dept),
        }
        for dept in effective_scope
    ]

    page = max(1, page)
    page_size = min(100, max(1, page_size))
    total = len(rows)
    start = (page - 1) * page_size
    end = start + page_size
    table_rows = deepcopy(rows[start:end])

    return {
        "meta": {
            "data_filters": data_filters,
            "effective_scope": effective_scope,
            "sql_preview": sql_preview,
            "sql_params": params,
            "dimension": dimension,
        },
        "kpis": kpis,
        "trend": {
            "categories": categories,
            "bar": {"name": "销售额", "data": bar},
            "line": {"name": "订单量", "data": line},
        },
        "distribution": pie,
        "table": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "rows": table_rows,
        },
    }
