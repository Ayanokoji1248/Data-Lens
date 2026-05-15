from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
import re
from typing import Any

from app.core.config import settings


DUCKDB_TYPES = {
    "boolean": "BOOLEAN",
    "integer": "BIGINT",
    "float": "DOUBLE",
    "date": "DATE",
    "datetime": "TIMESTAMP",
    "text": "VARCHAR",
}

BLOCKED_QUERY_PATTERNS = (
    r"\binsert\b",
    r"\bupdate\b",
    r"\bdelete\b",
    r"\bdrop\b",
    r"\balter\b",
    r"\bcreate\b",
    r"\battach\b",
    r"\bdetach\b",
    r"\bcopy\b",
    r"\bpragma\b",
    r"\bcall\b",
    r"\bset\b",
    r"\binstall\b",
    r"\bload\b",
    r"\bexport\b",
    r"\bimport\b",
    r"\bread_csv\b",
    r"\bread_csv_auto\b",
    r"\bread_json\b",
    r"\bread_json_auto\b",
    r"\bread_parquet\b",
    r"\bread_text\b",
    r"\bglob\b",
    r"\bhttpfs\b",
    r"\bsqlite_scan\b",
    r"\bpostgres_scan\b",
)


def get_duckdb_path() -> Path:
    duckdb_path = Path(settings.duckdb_path)
    if not duckdb_path.is_absolute():
        duckdb_path = Path(__file__).resolve().parents[2] / duckdb_path
    return duckdb_path


def store_rows(table_name: str, columns: list[dict[str, Any]], rows: list[dict[str, Any]]) -> None:
    import duckdb

    duckdb_path = get_duckdb_path()
    duckdb_path.parent.mkdir(parents=True, exist_ok=True)

    with duckdb.connect(str(duckdb_path)) as connection:
        drop_table(connection, table_name)
        column_definitions = [
            f"{_quote_identifier(column['storedName'])} {DUCKDB_TYPES[column['inferredType']]}"
            for column in columns
        ]
        connection.execute(
            f"CREATE TABLE {_quote_identifier(table_name)} ({', '.join(column_definitions)})"
        )

        if not rows:
            return

        column_names = [column["storedName"] for column in columns]
        placeholders = ", ".join(["?"] * len(column_names))
        insert_sql = (
            f"INSERT INTO {_quote_identifier(table_name)} "
            f"({', '.join(_quote_identifier(name) for name in column_names)}) "
            f"VALUES ({placeholders})"
        )
        values = [tuple(row[name] for name in column_names) for row in rows]
        connection.executemany(insert_sql, values)


def drop_table_by_name(table_name: str) -> None:
    import duckdb

    duckdb_path = get_duckdb_path()
    if not duckdb_path.exists():
        return

    with duckdb.connect(str(duckdb_path)) as connection:
        drop_table(connection, table_name)


def preview_rows(table_name: str, limit: int = 20) -> list[dict[str, Any]]:
    import duckdb

    safe_limit = max(1, min(limit, 100))
    duckdb_path = get_duckdb_path()
    if not duckdb_path.exists():
        raise FileNotFoundError("DuckDB database does not exist yet.")

    with duckdb.connect(str(duckdb_path)) as connection:
        result = connection.execute(
            f"SELECT * FROM {_quote_identifier(table_name)} LIMIT ?",
            [safe_limit],
        )
        return _rows_to_dicts(result)


def run_read_query(table_name: str, query: str, limit: int = 20) -> list[dict[str, Any]]:
    import duckdb

    safe_query = _validate_read_query(query)
    safe_limit = max(1, min(limit, 100))
    duckdb_path = get_duckdb_path()
    if not duckdb_path.exists():
        raise FileNotFoundError("DuckDB database does not exist yet.")

    with duckdb.connect(str(duckdb_path)) as connection:
        connection.execute(
            f"CREATE TEMP VIEW current_file AS SELECT * FROM {_quote_identifier(table_name)}"
        )
        result = connection.execute(f"SELECT * FROM ({safe_query}) AS query_result LIMIT ?", [safe_limit])
        return _rows_to_dicts(result)


def drop_table(connection: Any, table_name: str) -> None:
    connection.execute(f"DROP TABLE IF EXISTS {_quote_identifier(table_name)}")


def _quote_identifier(identifier: str) -> str:
    escaped_identifier = identifier.replace('"', '""')
    return f'"{escaped_identifier}"'


def _validate_read_query(query: str) -> str:
    safe_query = query.strip().rstrip(";").strip()
    lowered_query = safe_query.lower()

    if not safe_query:
        raise ValueError("SQL query cannot be empty.")

    if ";" in safe_query:
        raise ValueError("Only one SQL statement is allowed.")

    if not (lowered_query.startswith("select ") or lowered_query.startswith("with ")):
        raise ValueError("Only read-only SELECT queries are allowed.")

    if not re.search(r"\bcurrent_file\b", lowered_query):
        raise ValueError("Queries must read from the current_file table alias.")

    if any(re.search(pattern, lowered_query) for pattern in BLOCKED_QUERY_PATTERNS):
        raise ValueError("Only safe read-only queries against current_file are allowed.")

    return safe_query


def _rows_to_dicts(result: Any) -> list[dict[str, Any]]:
    column_names = [column[0] for column in result.description]
    return [
        {column_name: _serialize_value(value) for column_name, value in zip(column_names, row)}
        for row in result.fetchall()
    ]


def _serialize_value(value: Any) -> Any:
    if isinstance(value, (date, datetime)):
        return value.isoformat()

    if isinstance(value, Decimal):
        return float(value)

    return value
