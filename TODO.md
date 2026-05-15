# KnowYourSheet Development TODO

This file tracks the next implementation path after authenticated file upload.

## Current State

- Auth is working with cookie-based sessions.
- Dashboard has a file picker.
- `POST /api/files/upload` accepts `.csv`, `.xls`, and `.xlsx`.
- Upload endpoint currently validates the file and returns queued metadata, but does not persist or process the file yet.

## Phase 1: Decide Storage Architecture

- [ ] Decide where parsed spreadsheet data should live:
  - Option A: DuckDB for analytical querying over uploaded tabular data.
  - Option B: Postgres tables for structured relational storage.
  - Option C: Hybrid, Postgres for app records and DuckDB for analytical sheet data.
- [ ] Decide where file metadata should live:
  - Option A: Postgres, recommended for now because users/auth already use SQLAlchemy.
  - Option B: MongoDB if flexible metadata grows quickly.
- [ ] Pick a first implementation path.

Recommended first path:

- Postgres for file metadata.
- DuckDB for parsed sheet/tabular data.
- Store uploaded raw files on local disk during development.

## Phase 2: File Metadata Model

- [ ] Create a `files` or `uploaded_files` table.
- [ ] Store:
  - `id`
  - `user_id`
  - `original_filename`
  - `stored_filename`
  - `content_type`
  - `size_bytes`
  - `extension`
  - `status` (`queued`, `processing`, `ready`, `failed`)
  - `storage_path`
  - `row_count`
  - `column_count`
  - `sheet_count`
  - `error_message`
  - `created_at`
  - `updated_at`
- [ ] Add SQLAlchemy model.
- [ ] Add Pydantic response schema.
- [ ] Return persisted metadata from `POST /api/files/upload`.

## Phase 3: Raw File Storage

- [ ] Create a server upload directory, for example `server/uploads`.
- [ ] Save uploaded file with a generated safe filename.
- [ ] Keep the original filename only as metadata.
- [ ] Enforce file size limit.
- [ ] Reject unsupported file extensions.
- [ ] Reject empty files.
- [ ] Make upload path configurable through `.env`.

## Phase 4: Parse Uploaded Files

- [ ] Add parsing dependencies:
  - CSV: built-in Python `csv` or `pandas`.
  - Excel: `openpyxl` or `pandas`.
- [ ] Parse CSV files.
- [ ] Parse XLSX files.
- [ ] Decide whether legacy `.xls` is supported immediately or later.
- [ ] Extract:
  - column names
  - inferred data types
  - row count
  - null/missing value counts
  - sample rows
  - sheet names for Excel files
- [ ] Update file metadata after parsing.

## Phase 5: Store Parsed Data

DuckDB path:

- [ ] Add DuckDB dependency.
- [ ] Create one DuckDB database file for development.
- [ ] Create a table per uploaded file or normalized naming strategy.
- [ ] Store parsed rows in DuckDB.
- [ ] Store mapping from `uploaded_file.id` to DuckDB table name in Postgres.
- [ ] Add cleanup behavior if upload processing fails.

Postgres path:

- [ ] Design dynamic table strategy or generic cell/row storage.
- [ ] Evaluate performance for larger spreadsheets.
- [ ] Avoid creating unsafe table names from user filenames.

## Phase 6: Query API

- [ ] Create `POST /api/files/{file_id}/query`.
- [ ] Accept a natural-language or structured query payload.
- [ ] Start with simple structured operations:
  - list columns
  - preview rows
  - count rows
  - missing values by column
  - basic grouping and sorting
- [ ] Return query results in a consistent response shape.
- [ ] Enforce ownership: users can only query their own files.

## Phase 7: AI Query Layer

- [ ] Decide AI provider and SDK.
- [ ] Create a schema/context builder from uploaded file metadata:
  - file name
  - sheet names
  - columns
  - inferred types
  - sample rows
  - data quality summary
- [ ] Convert user questions into safe SQL or analytical operations.
- [ ] Add guardrails:
  - read-only queries
  - row limits
  - timeout handling
  - SQL validation
- [ ] Return:
  - direct answer
  - supporting rows or summary
  - generated query or operation

## Phase 8: AI Report Generation

- [ ] Create `POST /api/files/{file_id}/report`.
- [ ] Generate a report with:
  - executive summary
  - key trends
  - data quality issues
  - missing values
  - outliers
  - suggested follow-up questions
- [ ] Store generated reports or regenerate on demand.
- [ ] Add report UI on dashboard or file detail page.

## Phase 9: Frontend Integration

- [ ] After upload, show real file status instead of empty state.
- [ ] Add recent files from backend.
- [ ] Add My Sheets list from backend.
- [ ] Add file detail page.
- [ ] Add query/chat UI for selected file.
- [ ] Add loading, success, and failure states.
- [ ] Add retry action for failed processing.

## Phase 10: Background Processing

- [ ] Decide whether processing happens during upload request or background task.
- [ ] For development, synchronous processing may be acceptable.
- [ ] For production, use a background worker:
  - Celery/RQ/Arq
  - FastAPI background tasks for a simple first version
- [ ] Track processing status in metadata table.

## Phase 11: Testing

- [ ] Unit test file extension validation.
- [ ] Unit test upload metadata creation.
- [ ] Unit test CSV parsing.
- [ ] Unit test XLSX parsing.
- [ ] Test auth ownership checks.
- [ ] Test query endpoint with a known CSV.
- [ ] Test frontend upload success and error states.

## Near-Term Next Step

Implement Phase 2 and Phase 3 first:

1. Add Postgres metadata model for uploaded files.
2. Save raw uploaded files to disk.
3. Return persisted file metadata from `/api/files/upload`.

