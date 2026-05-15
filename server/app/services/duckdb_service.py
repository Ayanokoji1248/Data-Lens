from pathlib import Path
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


def drop_table(connection: Any, table_name: str) -> None:
    connection.execute(f"DROP TABLE IF EXISTS {_quote_identifier(table_name)}")


def _quote_identifier(identifier: str) -> str:
    escaped_identifier = identifier.replace('"', '""')
    return f'"{escaped_identifier}"'
