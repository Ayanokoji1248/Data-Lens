import json
import re
from typing import Any

from app.core.config import settings
from app.models.uploaded_file import UploadedFile
from app.services.duckdb_service import preview_rows


def build_report_context(uploaded_file: UploadedFile) -> dict[str, Any]:
    columns_metadata = uploaded_file.columns_metadata or {}
    columns = columns_metadata.get("columns", [])
    sample_rows: list[dict[str, Any]] = []

    if uploaded_file.duckdb_table_name:
        sample_rows = preview_rows(uploaded_file.duckdb_table_name, 50)

    return {
        "filename": uploaded_file.original_filename,
        "sheetNames": columns_metadata.get("sheetNames", []),
        "rowCount": uploaded_file.row_count or 0,
        "columnCount": uploaded_file.column_count or 0,
        "columns": columns,
        "dataQuality": _build_data_quality_summary(columns, uploaded_file.row_count or 0),
        "sampleRows": sample_rows,
        "sampleRowsPurpose": (
            "These 50 rows are only for understanding structure, examples, value formats, "
            "and possible meaning. They are not statistically representative of the full file."
        ),
    }


def generate_file_report(uploaded_file: UploadedFile) -> dict[str, Any]:
    if not settings.google_gemini_key:
        raise RuntimeError("GOOGLE_GEMINI_KEY is not configured on the backend.")

    raw_response = _call_gemini(build_report_context(uploaded_file))
    report = _parse_json_response(raw_response)
    return _normalize_report(report)


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


def _call_gemini(report_context: dict[str, Any]) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.google_gemini_key)
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=_build_report_prompt(report_context),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.2,
        ),
    )

    if not response.text:
        raise RuntimeError("Gemini returned an empty report response.")

    return response.text


def _build_report_prompt(report_context: dict[str, Any]) -> str:
    return (
        "You are the report writer for Data Lens, an AI spreadsheet analytics system.\n"
        "Your job is to create a concise, accurate, business-friendly report for the currently uploaded file.\n\n"

        "STRICT DATA BOUNDARY:\n"
        "- Use ONLY the provided Report context.\n"
        "- Do NOT use external knowledge.\n"
        "- Do NOT discuss other files, previous uploads, or unavailable data.\n"
        "- Do NOT infer facts that are not supported by the context.\n"
        "- Do NOT invent column names, row counts, totals, averages, trends, categories, or insights.\n\n"

        "DATA INTERPRETATION RULES:\n"
        "- Whole-file claims may ONLY be made from computed metadata or summaries in the context.\n"
        "- Examples of valid whole-file evidence include row count, column count, column names, data types, "
        "null counts, distinct counts, min/max values, averages, totals, and other precomputed summaries.\n"
        "- If the context does not include a computed summary, do NOT present it as a dataset-level fact.\n"
        "- If the meaning of a column is unclear, describe it cautiously instead of guessing.\n"
        "- If a column name suggests a meaning but the context does not confirm it, use phrases like "
        "'appears to', 'may represent', or 'based on the column name'.\n\n"

        "SAMPLE ROW RULES:\n"
        "- Sample rows are provided ONLY to understand structure, example values, value formats, "
        "and possible column meaning.\n"
        "- Do NOT treat sample rows as statistically representative of the full dataset.\n"
        "- Do NOT make whole-dataset claims from sample rows.\n"
        "- If an observation comes from sample rows, explicitly phrase it as sample-based.\n"
        "- Correct examples:\n"
        "  - 'In the sample rows, values appear to follow a date format.'\n"
        "  - 'Sample records suggest this column may contain customer names.'\n"
        "- Incorrect examples:\n"
        "  - 'Most customers are from Mumbai.'\n"
        "  - 'Sales are increasing over time.'\n\n"

        "REPORT CONTENT RULES:\n"
        "- Keep the report concise, useful, and readable for a business user.\n"
        "- Focus on what the file contains, data quality, visible structure, and safe observations.\n"
        "- Mention important columns when relevant.\n"
        "- Highlight potential data quality issues only when supported by the context, such as missing values, "
        "duplicate indicators, inconsistent formats, or unusual data types.\n"
        "- Do NOT include suggested questions.\n"
        "- Do NOT include suggested SQL.\n"
        "- Do NOT include code.\n"
        "- Do NOT provide recommendations that require external business knowledge.\n"
        "- Do NOT overstate confidence.\n\n"

        "REQUIRED REPORT STRUCTURE:\n"
        "- The title should be short and specific to the file or dataset when possible.\n"
        "- The executiveSummary should be 2 to 4 sentences.\n"
        "- The sections array should include these sections in this order:\n"
        "  1. Dataset Overview\n"
        "  2. Key Columns and Structure\n"
        "  3. Data Quality Notes\n"
        "  4. Sample-Based Observations\n"
        "  5. Limitations\n\n"

        "SECTION GUIDANCE:\n"
        "- Dataset Overview: summarize row count, column count, and general dataset purpose only if supported.\n"
        "- Key Columns and Structure: describe important columns, data types, and apparent structure.\n"
        "- Data Quality Notes: discuss nulls, missing values, duplicates, inconsistent types, or formatting issues "
        "only if present in the context.\n"
        "- Sample-Based Observations: describe only what can be safely observed from sample rows.\n"
        "- Limitations: always explain that sample rows are contextual and are not proof of whole-file patterns. "
        "Also mention any missing summaries that limit deeper analysis.\n\n"

        "EMPTY OR LIMITED CONTEXT RULES:\n"
        "- If the context is empty or insufficient, still return valid JSON.\n"
        "- In that case, explain that the report cannot provide meaningful insights because the context is limited.\n"
        "- Do NOT fill gaps with assumptions.\n\n"

        "OUTPUT FORMAT:\n"
        "Return ONLY valid JSON.\n"
        "Do NOT include markdown.\n"
        "Do NOT wrap the JSON in code fences.\n"
        "Do NOT include comments.\n"
        "Do NOT include trailing commas.\n"
        "All string values must be valid JSON strings.\n"
        "The JSON must exactly match this shape:\n"
        '{"title":"string","executiveSummary":"string","sections":[{"title":"string","content":"string"}]}\n\n'

        "OUTPUT FIELD RULES:\n"
        "- title must be a non-empty string.\n"
        "- executiveSummary must be a non-empty string.\n"
        "- sections must be an array of objects.\n"
        "- Each section object must contain only title and content.\n"
        "- Each section title must be a non-empty string.\n"
        "- Each section content must be a non-empty string.\n"
        "- Do NOT add extra top-level fields.\n\n"

        f"Report context:\n{json.dumps(report_context, default=str, ensure_ascii=False)}"
    )

def _parse_json_response(raw_response: str) -> dict[str, Any]:
    cleaned_response = raw_response.strip()
    fenced_match = re.search(r"```(?:json)?\s*(.*?)\s*```", cleaned_response, re.DOTALL)
    if fenced_match:
        cleaned_response = fenced_match.group(1).strip()

    try:
        parsed_response = json.loads(cleaned_response)
    except json.JSONDecodeError as exc:
        raise ValueError("Gemini returned a report that was not valid JSON.") from exc

    if not isinstance(parsed_response, dict):
        raise ValueError("Gemini returned an invalid report shape.")

    return parsed_response


def _normalize_report(report: dict[str, Any]) -> dict[str, Any]:
    title = _normalize_text(report.get("title")) or "File Report"
    executive_summary = _normalize_text(report.get("executiveSummary")) or (
        "A report was generated for this file."
    )
    sections = report.get("sections")

    if not isinstance(sections, list):
        sections = []

    normalized_sections = []
    has_limitations = False
    for section in sections:
        if not isinstance(section, dict):
            continue
        section_title = _normalize_text(section.get("title"))
        section_content = _normalize_text(section.get("content"))
        if not section_title or not section_content:
            continue
        if section_title.strip().lower() == "limitations":
            has_limitations = True
        normalized_sections.append({"title": section_title, "content": section_content})

    if not has_limitations:
        normalized_sections.append(
            {
                "title": "Limitations",
                "content": (
                    "This report uses file metadata and a limited set of sample rows for context. "
                    "The sample rows should not be treated as statistically representative of the "
                    "entire file."
                ),
            }
        )

    return {
        "title": title,
        "executiveSummary": executive_summary,
        "sections": normalized_sections,
    }


def _normalize_text(value: Any) -> str | None:
    if not isinstance(value, str):
        return None

    normalized_value = value.strip()
    return normalized_value or None
