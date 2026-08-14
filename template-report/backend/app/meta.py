"""Report metadata contract for Host sync."""

REPORT_CODE = "template-report"

REPORT_META = {
    "report_code": REPORT_CODE,
    "title": "模板报表",
    "filterable_fields": [
        {
            "field_key": "dept",
            "label": "区域",
            "value_type": "enum",
            "operators": ["in", "eq"],
            "value_source": "static",
            "values": ["华东区", "华北区", "华南区", "西南区"],
            "required": False,
        }
    ],
}
