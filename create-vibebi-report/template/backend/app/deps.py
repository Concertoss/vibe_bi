"""Gateway header helpers for sub-report services."""

from __future__ import annotations

import json
from typing import Annotated, Any

from fastapi import Header


def parse_data_scope(raw: str | None) -> list[str]:
    """Parse X-Data-Scope header (JSON array or comma-separated)."""
    if raw is None or not str(raw).strip():
        return []
    text = str(raw).strip()
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
        if isinstance(parsed, str) and parsed.strip():
            return [parsed.strip()]
    except json.JSONDecodeError:
        pass
    return [p.strip() for p in text.split(",") if p.strip()]


def get_data_scope(
    x_data_scope: Annotated[str | None, Header(alias="X-Data-Scope")] = None,
) -> list[str]:
    """Legacy dependency — prefer get_data_filters for new code."""
    return parse_data_scope(x_data_scope)


def get_data_filters(
    x_data_filters: Annotated[str | None, Header(alias="X-Data-Filters")] = None,
    x_data_scope: Annotated[str | None, Header(alias="X-Data-Scope")] = None,
) -> list[dict[str, Any]]:
    """Parse structured X-Data-Filters from Host gateway.

    Fallback: synthesize a dept/region in-filter from legacy X-Data-Scope.
    """
    if x_data_filters and str(x_data_filters).strip():
        try:
            parsed = json.loads(x_data_filters)
            if isinstance(parsed, list):
                out: list[dict[str, Any]] = []
                for item in parsed:
                    if not isinstance(item, dict) or not item.get("field"):
                        continue
                    values = item.get("values") or []
                    if not isinstance(values, list):
                        values = [values]
                    out.append(
                        {
                            "field": str(item["field"]),
                            "op": str(item.get("op") or "in"),
                            "values": [str(v) for v in values],
                        }
                    )
                return out
        except json.JSONDecodeError:
            pass

    scope = parse_data_scope(x_data_scope)
    if scope:
        return [{"field": "dept", "op": "in", "values": scope}]
    return []


def build_dept_in_clause(
    scopes: list[str],
    *,
    param_prefix: str = "dept",
) -> tuple[str, dict[str, str]]:
    """Build a parameterized `dept IN (...)` fragment for SQL demos."""
    if not scopes:
        return "1=1", {}
    placeholders: list[str] = []
    params: dict[str, str] = {}
    for i, dept in enumerate(scopes):
        key = f"{param_prefix}_{i}"
        placeholders.append(f":{key}")
        params[key] = dept
    return f"dept IN ({', '.join(placeholders)})", params


def build_where_from_filters(
    filters: list[dict[str, Any]],
    *,
    allowed_fields: set[str] | None = None,
) -> tuple[str, dict[str, str]]:
    """Build AND-combined parameterized WHERE from X-Data-Filters."""
    clauses: list[str] = []
    params: dict[str, str] = {}
    for idx, f in enumerate(filters):
        field = str(f.get("field") or "")
        if not field:
            continue
        if allowed_fields is not None and field not in allowed_fields:
            continue
        op = str(f.get("op") or "in")
        values = [str(v) for v in (f.get("values") or [])]
        if not values:
            clauses.append("1=0")
            continue
        if op == "eq":
            key = f"f_{idx}"
            clauses.append(f"{field} = :{key}")
            params[key] = values[0]
        else:
            keys: list[str] = []
            for j, val in enumerate(values):
                key = f"f_{idx}_{j}"
                keys.append(f":{key}")
                params[key] = val
            clauses.append(f"{field} IN ({', '.join(keys)})")
    if not clauses:
        return "1=1", {}
    return " AND ".join(clauses), params


def assert_scope_or_demo(scopes: list[str], demo_all: list[str]) -> list[str]:
    """Local debug: empty header → use demo_all."""
    return scopes if scopes else list(demo_all)


def scopes_from_filters(filters: list[dict[str, Any]], field_keys: set[str]) -> list[str]:
    for f in filters:
        if f.get("field") in field_keys:
            return [str(v) for v in (f.get("values") or [])]
    return []
