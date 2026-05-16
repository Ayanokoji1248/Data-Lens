import json
import re
from typing import Any, Literal

from app.core.config import settings
from app.models.uploaded_file import UploadedFile
from app.services.duckdb_service import preview_rows, validate_read_query


ChatOperation = Literal["answer", "sql"]


def build_file_summary(uploaded_file: UploadedFile) -> dict[str, Any]:
    columns_metadata = uploaded_file.columns_metadata or {}
    return {
        "filename": uploaded_file.original_filename,
        "sheetNames": columns_metadata.get("sheetNames", []),
        "rowCount": uploaded_file.row_count or 0,
        "columnCount": uploaded_file.column_count or 0,
        "columns": columns_metadata.get("columns", []),
    }


def generate_file_chat_response(uploaded_file: UploadedFile, message: str) -> dict[str, Any]:
    if not settings.google_gemini_key:
        raise RuntimeError("GOOGLE_GEMINI_KEY is not configured on the backend.")

    file_context = _build_file_context(uploaded_file)
    raw_response = _call_gemini(message, file_context)
    parsed_response = _parse_json_response(raw_response)

    operation = parsed_response.get("operation")
    answer = _normalize_text(parsed_response.get("answer"))
    sql = _normalize_text(parsed_response.get("sql"))

    if operation not in {"answer", "sql"}:
        operation = "sql" if sql else "answer"

    if operation == "sql":
        if not sql:
            raise ValueError("Gemini did not return SQL for this request.")
        sql = validate_read_query(sql)
        answer = answer or "I drafted a safe read-only query for the current file."
    else:
        sql = None
        answer = answer or "I can only answer questions about the currently opened file."

    return {
        "answer": answer,
        "sql": sql,
        "operation": operation,
        "summary": build_file_summary(uploaded_file),
    }


def _build_file_context(uploaded_file: UploadedFile) -> dict[str, Any]:
    summary = build_file_summary(uploaded_file)
    sample_rows: list[dict[str, Any]] = []

    if uploaded_file.duckdb_table_name:
        try:
            sample_rows = preview_rows(uploaded_file.duckdb_table_name, 5)
        except Exception:
            sample_rows = []

    return {
        **summary,
        "sampleRows": sample_rows,
        "dataQuality": _build_data_quality_summary(summary["columns"], summary["rowCount"]),
    }


def _build_data_quality_summary(columns: list[dict[str, Any]], row_count: int) -> dict[str, Any]:
    columns_with_nulls = [
        {
            "column": column.get("originalName") or column.get("storedName"),
            "storedName": column.get("storedName"),
            "nullCount": column.get("nullCount", 0),
        }
        for column in columns
        if column.get("nullCount", 0)
    ]

    return {
        "rowCount": row_count,
        "columnsWithNulls": columns_with_nulls,
        "emptyColumns": [
            column.get("storedName")
            for column in columns
            if row_count > 0 and column.get("nullCount", 0) >= row_count
        ],
    }


def _call_gemini(message: str, file_context: dict[str, Any]) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.google_gemini_key)
    prompt = _build_prompt(message, file_context)
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")

    return response.text


def _build_prompt(message: str, file_context: dict[str, Any]) -> str:
    return (
        "You are the AI query layer for Data Lens, an AI spreadsheet analytics system.\n"
        "Your job is to help the user understand or query the currently uploaded file.\n\n"
        "STRICT DATA BOUNDARY:\n"
        "- You may ONLY use the provided Current file context.\n"
        "- Do NOT use external knowledge.\n"
        "- Do NOT answer questions about other files, previous uploads, or unavailable data.\n"
        "- If the user asks a cross-file or unavailable-data question, return an answer explaining "
        "that only the current file can be used.\n\n"
        "DECISION RULES:\n"
        "Return operation='answer' ONLY when the question can be answered from metadata/context "
        "without computing over rows.\n"
        "Examples suitable for operation='answer':\n"
        "- explaining what columns exist\n"
        "- describing the dataset from provided summary/context\n"
        "- explaining what kind of analysis is possible\n"
        "- clarifying limitations\n\n"
        "Return operation='sql' when the user asks for anything requiring computation over the data.\n"
        "This includes but is not limited to:\n"
        "- row-level analysis\n"
        "- filtering\n"
        "- sorting\n"
        "- grouping\n"
        "- aggregation\n"
        "- counting\n"
        "- sums, averages, min, max\n"
        "- comparisons\n"
        "- rankings\n"
        "- trends\n"
        "- duplicate detection\n"
        "- missing value checks\n"
        "- searching rows\n"
        "- top/bottom records\n"
        "- date-based analysis\n"
        "- conditional analysis\n\n"
        "SQL RULES:\n"
        "- SQL must be DuckDB-compatible.\n"
        "- SQL must be read-only.\n"
        "- SQL must be a single SELECT statement or a single WITH ... SELECT statement.\n"
        "- SQL must read only from current_file.\n"
        "- Treat current_file as the table name.\n"
        "- Use the provided storedName values as the real SQL column names.\n"
        "- Quote column names using double quotes.\n"
        "- Do NOT use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, COPY, EXPORT, ATTACH, "
        "INSTALL, LOAD, PRAGMA, or any non-read operation.\n"
        "- Prefer LIMIT 20 unless the user asks for a smaller or specific limit.\n"
        "- Never use SELECT * unless the user explicitly asks for all columns.\n"
        "- For previews or broad row requests, select the most relevant columns and apply LIMIT 20.\n"
        "- If the user asks for all rows, still apply a reasonable LIMIT unless they explicitly "
        "request no limit.\n"
        "- If a requested column does not exist, return operation='answer' and explain which columns "
        "are available.\n"
        "- If the request is ambiguous, generate the safest reasonable SQL query, or answer with a "
        "brief clarification when SQL cannot be safely generated.\n\n"
        "ANSWER RULES:\n"
        "- Do not pretend to know computed results unless they are explicitly present in the file context.\n"
        "- Do not invent column names, values, totals, insights, or statistics.\n"
        "- Keep answers concise and useful.\n"
        "- If the user asks what can be analyzed, suggest analyses based only on available columns.\n\n"
        "OUTPUT FORMAT:\n"
        "Return ONLY valid JSON.\n"
        "Do not include markdown.\n"
        "Do not include explanations outside JSON.\n"
        "Do not wrap the JSON in code fences.\n"
        "The JSON must exactly match this shape:\n"
        '{"operation":"answer|sql","answer":"string or null","sql":"string or null"}\n\n'
        "OUTPUT FIELD RULES:\n"
        "- If operation='answer', then answer must be a string and sql must be null.\n"
        "- If operation='sql', then sql must be a string and answer must be null.\n"
        "- operation must be either 'answer' or 'sql'.\n\n"
        f"Current file context:\n{json.dumps(file_context, default=str, ensure_ascii=False)}\n\n"
        f"User message:\n{message}"
    )


def _parse_json_response(raw_response: str) -> dict[str, Any]:
    cleaned_response = raw_response.strip()
    fenced_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned_response, re.DOTALL)
    if fenced_match:
        cleaned_response = fenced_match.group(1).strip()

    try:
        parsed_response = json.loads(cleaned_response)
    except json.JSONDecodeError as exc:
        raise ValueError("Gemini returned a response that was not valid JSON.") from exc

    if not isinstance(parsed_response, dict):
        raise ValueError("Gemini returned an invalid response shape.")

    return parsed_response


def _normalize_text(value: Any) -> str | None:
    if not isinstance(value, str):
        return None

    normalized_value = value.strip()
    return normalized_value or None
