from typing import Any, Literal

from app.models.uploaded_file import UploadedFile
from app.services.duckdb_service import run_read_query


ChartType = Literal["bar", "donut", "line", "histogram"]
Aggregation = Literal["count", "sum", "avg", "min", "max"]

NUMERIC_TYPES = {"integer", "float"}
DATE_TYPES = {"date", "datetime"}
CATEGORY_TYPES = {"text", "boolean"}


def build_chart_suggestions(uploaded_file: UploadedFile) -> list[dict[str, Any]]:
    columns = _get_columns(uploaded_file)
    suggestions: list[dict[str, Any]] = []

    category_columns = [
        column
        for column in columns
        if column.get("inferredType") in CATEGORY_TYPES and not _is_identifier_like(column)
    ]
    date_columns = [column for column in columns if column.get("inferredType") in DATE_TYPES]
    numeric_columns = [
        column
        for column in columns
        if column.get("inferredType") in NUMERIC_TYPES and not _is_identifier_like(column)
    ]

    for column in category_columns[:3]:
        chart_type: ChartType = "donut" if _sample_cardinality(column) <= 6 else "bar"
        suggestions.append(
            {
                "title": f"Records by {_column_label(column)}",
                "chartType": chart_type,
                "dimension": column["storedName"],
                "measure": None,
                "aggregation": "count",
                "limit": 10 if chart_type == "donut" else 20,
            }
        )

    for column in date_columns[:1]:
        suggestions.append(
            {
                "title": f"Records by {_column_label(column)} year",
                "chartType": "line",
                "dimension": column["storedName"],
                "measure": None,
                "aggregation": "count",
                "limit": 20,
            }
        )

    for column in numeric_columns[:1]:
        suggestions.append(
            {
                "title": f"{_column_label(column)} distribution",
                "chartType": "histogram",
                "dimension": column["storedName"],
                "measure": None,
                "aggregation": "count",
                "limit": 20,
            }
        )

    return suggestions[:5]


def run_chart_query(uploaded_file: UploadedFile, payload: Any) -> dict[str, Any]:
    columns = _get_columns(uploaded_file)
    dimension = _find_column(columns, payload.dimension)
    measure = _find_column(columns, payload.measure) if payload.measure else None
    limit = max(1, min(payload.limit, 50))

    if payload.aggregation != "count" and measure is None:
        raise ValueError("A numeric measure column is required for this aggregation.")

    if measure and measure.get("inferredType") not in NUMERIC_TYPES:
        raise ValueError("Measure column must be numeric.")

    if payload.chart_type in {"bar", "donut"}:
        sql = _build_category_sql(dimension, measure, payload.aggregation, limit)
    elif payload.chart_type == "line":
        sql = _build_line_sql(dimension, measure, payload.aggregation, limit)
    elif payload.chart_type == "histogram":
        sql = _build_histogram_sql(dimension, limit)
    else:
        raise ValueError("Unsupported chart type.")

    rows = run_read_query(uploaded_file.duckdb_table_name, sql, limit)
    return {
        "title": _build_title(payload.chart_type, dimension, measure, payload.aggregation),
        "chartType": payload.chart_type,
        "data": [
            {
                "label": str(row["label"]),
                "value": row["value"] or 0,
            }
            for row in rows
        ],
    }


def _build_category_sql(
    dimension: dict[str, Any],
    measure: dict[str, Any] | None,
    aggregation: Aggregation,
    limit: int,
) -> str:
    dimension_name = _quote_identifier(dimension["storedName"])
    value_expression = _aggregation_expression(measure, aggregation)
    return (
        f"SELECT COALESCE(CAST({dimension_name} AS VARCHAR), '(blank)') AS label, "
        f"{value_expression} AS value "
        "FROM current_file "
        f"GROUP BY {dimension_name} "
        "ORDER BY value DESC "
        f"LIMIT {limit}"
    )


def _build_line_sql(
    dimension: dict[str, Any],
    measure: dict[str, Any] | None,
    aggregation: Aggregation,
    limit: int,
) -> str:
    if dimension.get("inferredType") not in DATE_TYPES:
        return _build_category_sql(dimension, measure, aggregation, limit)

    dimension_name = _quote_identifier(dimension["storedName"])
    value_expression = _aggregation_expression(measure, aggregation)
    return (
        f"SELECT STRFTIME(DATE_TRUNC('year', {dimension_name}), '%Y') AS label, "
        f"{value_expression} AS value "
        "FROM current_file "
        f"WHERE {dimension_name} IS NOT NULL "
        "GROUP BY label "
        "ORDER BY label ASC "
        f"LIMIT {limit}"
    )


def _build_histogram_sql(dimension: dict[str, Any], limit: int) -> str:
    if dimension.get("inferredType") not in NUMERIC_TYPES:
        raise ValueError("Histogram dimension must be numeric.")

    dimension_name = _quote_identifier(dimension["storedName"])
    return (
        "WITH bounds AS ("
        f"SELECT MIN({dimension_name}) AS min_value, MAX({dimension_name}) AS max_value "
        "FROM current_file "
        f"WHERE {dimension_name} IS NOT NULL"
        "), bucketed AS ("
        f"SELECT CASE WHEN bounds.max_value = bounds.min_value THEN 0 "
        f"ELSE FLOOR(({dimension_name} - bounds.min_value) / "
        "NULLIF((bounds.max_value - bounds.min_value) / 10.0, 0)) END AS bucket, "
        f"bounds.min_value, bounds.max_value "
        "FROM current_file, bounds "
        f"WHERE {dimension_name} IS NOT NULL"
        ") "
        "SELECT CAST(bucket AS VARCHAR) AS label, COUNT(*) AS value "
        "FROM bucketed "
        "GROUP BY bucket "
        "ORDER BY bucket ASC "
        f"LIMIT {limit}"
    )


def _aggregation_expression(measure: dict[str, Any] | None, aggregation: Aggregation) -> str:
    if aggregation == "count":
        return "COUNT(*)"

    if measure is None:
        raise ValueError("A measure column is required for this aggregation.")

    measure_name = _quote_identifier(measure["storedName"])
    return f"{aggregation.upper()}({measure_name})"


def _build_title(
    chart_type: ChartType,
    dimension: dict[str, Any],
    measure: dict[str, Any] | None,
    aggregation: Aggregation,
) -> str:
    dimension_label = _column_label(dimension)
    if chart_type == "histogram":
        return f"{dimension_label} distribution"
    if chart_type == "line" and dimension.get("inferredType") in DATE_TYPES:
        return f"Records by {dimension_label} year"
    if measure:
        return f"{aggregation.upper()} {_column_label(measure)} by {dimension_label}"
    return f"Records by {dimension_label}"


def _get_columns(uploaded_file: UploadedFile) -> list[dict[str, Any]]:
    columns_metadata = uploaded_file.columns_metadata or {}
    columns = columns_metadata.get("columns", [])
    if not isinstance(columns, list):
        return []
    return columns


def _find_column(columns: list[dict[str, Any]], stored_name: str | None) -> dict[str, Any]:
    if not stored_name:
        raise ValueError("Column is required.")

    for column in columns:
        if column.get("storedName") == stored_name:
            return column

    raise ValueError("Requested column was not found in this file.")


def _sample_cardinality(column: dict[str, Any]) -> int:
    sample_values = column.get("sampleValues") or []
    return len(sample_values) if isinstance(sample_values, list) else 0


def _is_identifier_like(column: dict[str, Any]) -> bool:
    name = f"{column.get('originalName', '')} {column.get('storedName', '')}".lower()
    blocked_fragments = (
        "id",
        "index",
        "email",
        "phone",
        "first_name",
        "last_name",
        "name",
    )
    return any(fragment in name for fragment in blocked_fragments)


def _column_label(column: dict[str, Any]) -> str:
    return column.get("originalName") or column.get("storedName") or "Column"


def _quote_identifier(identifier: str) -> str:
    escaped_identifier = identifier.replace('"', '""')
    return f'"{escaped_identifier}"'
