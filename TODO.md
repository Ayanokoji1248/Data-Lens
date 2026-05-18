# KnowYourSheet Development TODO

This file tracks the current implementation state and the next development path.

## Already Completed

### Phase 1: Storage Architecture

- [x] Chosen architecture:
  - Postgres for users, auth, file metadata, ownership, and processing status.
  - DuckDB for parsed spreadsheet/tabular data and analytical queries.
  - Local `server/uploads` storage for raw uploaded files during development.

### Phase 2: File Metadata Model

- [x] Added `uploaded_files` SQLAlchemy model.
- [x] Stored:
  - `id`
  - `user_id`
  - `original_filename`
  - `stored_filename`
  - `content_type`
  - `size_bytes`
  - `extension`
  - `status`
  - `storage_path`
  - `duckdb_table_name`
  - `columns_metadata`
  - `row_count`
  - `column_count`
  - `sheet_count`
  - `error_message`
  - `created_at`
  - `updated_at`
- [x] Added Pydantic response schemas.
- [x] `POST /api/files/upload` returns persisted metadata.

### Phase 3: Raw File Storage

- [x] Created local upload storage under `server/uploads`.
- [x] Saved uploaded files with generated safe filenames.
- [x] Kept original filename only as metadata.
- [x] Enforced file size limit.
- [x] Rejected unsupported extensions.
- [x] Rejected empty files.
- [x] Made upload path configurable through settings.

### Phase 4: Parse Uploaded Files

- [x] Added CSV parsing using Python `csv`.
- [x] Added XLSX parsing using `openpyxl`.
- [x] Extracted:
  - column names
  - sanitized DuckDB column names
  - inferred data types
  - row count
  - column count
  - null/missing value counts
  - sample values
  - sheet names for Excel files
- [x] Updated file metadata after parsing.
- [x] `.xls` is accepted as raw upload but marked failed/unsupported for parsing.

### Phase 5: Store Parsed Data

- [x] Added DuckDB dependency.
- [x] Created local `data_lens.duckdb` development database.
- [x] Created one DuckDB table per uploaded file.
- [x] Stored parsed rows in DuckDB.
- [x] Stored mapping from `uploaded_files.id` to DuckDB table name in Postgres.
- [x] Added cleanup behavior for failed DuckDB processing.

### Phase 6: Query API

- [x] Added `GET /api/files/{file_id}/preview`.
- [x] Added `POST /api/files/{file_id}/query`.
- [x] Enforced ownership checks.
- [x] Used safe `current_file` alias for querying the selected file.
- [x] Added read-only SQL validation.
- [x] Added query result row limits.

### Phase 9: Frontend Integration

- [x] Dashboard shows real uploaded file state.
- [x] Recent files load from backend.
- [x] My Sheets loads from backend.
- [x] Added file detail page at `/dashboard/my-sheets/{file_id}`.
- [x] Added SQL editor tab for selected file.
- [x] Added query output table.
- [x] Added placeholder Report and Charts tabs.
- [x] Added placeholder AI chat panel.
- [x] Added loading/error handling for file API calls.

## Next Combined TODO

### 1. AI Query Layer

- [x] Choose AI provider and SDK.
  - Google Gemini through `google-genai`.
- [x] Add backend chat endpoint:
  - `POST /api/files/{file_id}/chat`
- [x] Build file context from:
  - filename
  - sheet names
  - columns
  - inferred types
  - sample rows
  - row/column counts
  - data quality summary
- [x] Convert user questions into safe SQL or analytical operations.
- [x] Reuse existing SQL guardrails:
  - ownership checks
  - read-only queries
  - `current_file` alias
  - row limits
  - SQL validation
- [x] Return:
  - direct answer
  - generated SQL or operation
  - supporting summary
- [x] Keep chat v1 SQL-only for computed questions.
  - The chat endpoint validates generated SQL but does not execute it.
  - Users can copy/run generated SQL from the existing editor.

### 2. AI Chat Frontend

- [x] Connect right-side chat panel to backend.
- [x] Show loading state while AI answers.
- [x] Show assistant and user message history.
- [x] Show generated SQL under answer when useful.
- [x] Show safe error state when AI/query fails.
- [x] Use fixed-height textarea composer for chat input.

### 3. Report Tab

- [x] Add backend report endpoint:
  - `POST /api/files/{file_id}/report`
- [x] Add stored report fetch endpoint:
  - `GET /api/files/{file_id}/report`
- [x] Store generated reports in the database.
- [x] Generate:
  - executive summary
  - report sections
  - missing values
  - data quality issues
  - limitations
- [x] Decide whether reports are stored or regenerated on demand.
  - Reports are stored in `file_reports` and reused after the first generation.
- [x] Render report inside the existing Report tab.
- [x] Use metadata plus 50 sample rows as report context.
  - Sample rows are context only and not treated as statistically representative.

### 4. Charts Tab

- [x] Add chart UI using parsed DuckDB data.
- [x] Add backend chart suggestion endpoint:
  - `GET /api/files/{file_id}/charts/suggestions`
- [x] Add backend structured chart query endpoint:
  - `POST /api/files/{file_id}/charts/query`
- [x] Start with:
  - bar chart
  - line chart
  - pie/donut chart
  - histogram
- [x] Generate deterministic chart suggestions from column metadata.
- [ ] Let user manually choose columns and aggregation.
- [ ] Later allow AI to suggest charts.

### 5. Query API Improvements

- [ ] Return column metadata even when a query returns zero rows.
- [ ] Add query history.
- [ ] Add saved queries.
- [ ] Improve SQL validation with a proper SQL parser eventually.
- [ ] Add timeout handling for long queries.

### 6. Frontend Polish

- [ ] Add stronger loading states on My Sheets and detail page.
- [ ] Improve failed/processing file states.
- [ ] Add retry action for failed processing.
- [ ] Add schema/columns sidebar near SQL editor.
- [ ] Improve responsive layout for small laptop screens and wide desktop screens.

### 7. Background Processing

- [ ] Move parsing out of the upload request eventually.
- [ ] Use FastAPI background tasks as the first simple approach.
- [ ] Later evaluate Celery/RQ/Arq for production workers.
- [ ] Keep status tracking in `uploaded_files`.

### 8. Testing

- [ ] Unit test file extension validation.
- [ ] Unit test upload metadata creation.
- [ ] Unit test CSV parsing.
- [ ] Unit test XLSX parsing.
- [ ] Unit test DuckDB table creation.
- [ ] Test auth ownership checks.
- [ ] Test query endpoint safety.
- [ ] Test frontend upload success and error states.
- [ ] Test My Sheets list rendering.
- [ ] Test file detail preview rendering.
- [ ] Test SQL query interaction.

### 9. Production Storage

- [ ] Keep local `server/uploads` for development.
- [ ] Later move raw files to object storage:
  - AWS S3
  - Cloudflare R2
  - Supabase Storage
  - Google Cloud Storage
  - Azure Blob Storage
- [ ] Keep Postgres metadata and DuckDB/query layer separate.

## Recommended Next Step

Build the AI Query Layer and connect the existing AI chat panel, because uploads, parsing, DuckDB storage, preview, and safe SQL querying are already working.
