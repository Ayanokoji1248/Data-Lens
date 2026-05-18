from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.file_report import FileReport
from app.models.uploaded_file import UploadedFile
from app.schemas.uploaded_file import (
    FileChartQueryRequest,
    FileChartQueryResponse,
    FileChartSuggestionsResponse,
    FileChatRequest,
    FileChatResponse,
    FilePreviewResponse,
    FileQueryRequest,
    FileQueryResponse,
    FileReportResponse,
    FileUploadResponse,
    UploadedFileRead,
)
from app.services.auth_service import get_current_user
from app.services.ai_query_service import generate_file_chat_response
from app.services.chart_service import build_chart_suggestions, run_chart_query
from app.services.duckdb_service import drop_table_by_name, preview_rows, run_read_query, store_rows
from app.services.file_report_service import generate_file_report
from app.services.spreadsheet_parser import parse_spreadsheet

router = APIRouter()

ALLOWED_EXTENSIONS = {".csv", ".xls", ".xlsx"}
SERVER_ROOT = Path(__file__).resolve().parents[3]


def get_upload_dir() -> Path:
    upload_dir = Path(settings.upload_dir)
    if not upload_dir.is_absolute():
        upload_dir = SERVER_ROOT / upload_dir
    return upload_dir


@router.post(
    "/upload",
    response_model=FileUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_file(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    original_filename = file.filename or ""
    extension = Path(file.filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV, XLS, and XLSX files are supported.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file cannot be empty.",
        )

    if len(contents) > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file exceeds the maximum allowed size.",
        )

    upload_dir = get_upload_dir()
    stored_filename = f"{uuid4().hex}{extension}"
    storage_path = upload_dir / stored_filename

    try:
        upload_dir.mkdir(parents=True, exist_ok=True)
        storage_path.write_bytes(contents)
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save uploaded file.",
        ) from exc

    uploaded_file = UploadedFile(
        user_id=current_user.id,
        original_filename=original_filename,
        stored_filename=stored_filename,
        content_type=file.content_type,
        size_bytes=len(contents),
        extension=extension,
        status="queued",
        storage_path=str(storage_path),
    )

    try:
        db.add(uploaded_file)
        db.commit()
        db.refresh(uploaded_file)
    except SQLAlchemyError as exc:
        db.rollback()
        try:
            storage_path.unlink(missing_ok=True)
        except OSError:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not persist uploaded file metadata.",
        ) from exc

    table_name = f"uploaded_file_{uploaded_file.id}"
    uploaded_file.status = "processing"
    db.commit()
    db.refresh(uploaded_file)

    try:
        parsed_spreadsheet = parse_spreadsheet(
            storage_path,
            extension,
            settings.preview_sample_size,
        )
        store_rows(table_name, parsed_spreadsheet.columns, parsed_spreadsheet.rows)

        uploaded_file.status = "ready"
        uploaded_file.duckdb_table_name = table_name
        uploaded_file.row_count = parsed_spreadsheet.row_count
        uploaded_file.column_count = parsed_spreadsheet.column_count
        uploaded_file.sheet_count = parsed_spreadsheet.sheet_count
        uploaded_file.columns_metadata = {
            "columns": parsed_spreadsheet.columns,
            "sheetNames": parsed_spreadsheet.sheet_names,
        }
        uploaded_file.error_message = None
    except Exception as exc:
        try:
            drop_table_by_name(table_name)
        except Exception:
            pass
        uploaded_file.status = "failed"
        uploaded_file.error_message = str(exc)
    finally:
        db.commit()
        db.refresh(uploaded_file)

    return FileUploadResponse(
        message="File received for processing.",
        file=UploadedFileRead.model_validate(uploaded_file),
        userId=current_user.id,
    )


@router.get("", response_model=list[UploadedFileRead])
def list_uploaded_csv_files(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(UploadedFile)
        .filter(
            UploadedFile.user_id == current_user.id,
            UploadedFile.extension == ".csv",
        )
        .order_by(UploadedFile.created_at.desc())
        .all()
    )


@router.get("/{file_id}/preview", response_model=FilePreviewResponse)
def preview_uploaded_file(
    file_id: int,
    limit: int = 20,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploaded_file = db.get(UploadedFile, file_id)

    if uploaded_file is None or uploaded_file.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file was not found.",
        )

    if uploaded_file.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not ready for preview.",
        )

    if not uploaded_file.duckdb_table_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file does not have a query table yet.",
        )

    safe_limit = max(1, min(limit, 100))
    rows = preview_rows(uploaded_file.duckdb_table_name, safe_limit)
    columns_metadata = uploaded_file.columns_metadata or {}

    return FilePreviewResponse(
        file=UploadedFileRead.model_validate(uploaded_file),
        columns=columns_metadata.get("columns", []),
        rows=rows,
        limit=safe_limit,
    )


@router.get("/{file_id}/charts/suggestions", response_model=FileChartSuggestionsResponse)
def get_chart_suggestions(
    file_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploaded_file = _get_ready_owned_file(file_id, current_user.id, db, "charting")
    return {"suggestions": build_chart_suggestions(uploaded_file)}


@router.post("/{file_id}/charts/query", response_model=FileChartQueryResponse)
def query_file_chart(
    file_id: int,
    payload: FileChartQueryRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploaded_file = _get_ready_owned_file(file_id, current_user.id, db, "charting")

    try:
        return run_chart_query(uploaded_file, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Chart query failed: {exc}",
        ) from exc


@router.get("/{file_id}/report", response_model=FileReportResponse | None)
def get_file_report(
    file_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploaded_file = _get_ready_owned_file(file_id, current_user.id, db, "report")
    report = _get_report_for_file(uploaded_file.id, current_user.id, db)

    if report is None:
        return None

    return _serialize_file_report(report)


@router.post("/{file_id}/report", response_model=FileReportResponse)
def generate_uploaded_file_report(
    file_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploaded_file = _get_ready_owned_file(file_id, current_user.id, db, "report")
    report = _get_report_for_file(uploaded_file.id, current_user.id, db)

    if report and report.status == "ready" and report.report_json:
        return _serialize_file_report(report)

    if report and report.status == "processing":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A report is already being generated for this file.",
        )

    if report is None:
        report = FileReport(
            file_id=uploaded_file.id,
            user_id=current_user.id,
            status="processing",
            model=settings.gemini_model,
        )
        db.add(report)
    else:
        report.status = "processing"
        report.error_message = None
        report.model = settings.gemini_model

    try:
        db.commit()
        db.refresh(report)
        report.report_json = generate_file_report(uploaded_file)
        report.status = "ready"
        report.error_message = None
        db.commit()
        db.refresh(report)
    except Exception as exc:
        db.rollback()
        report = _get_report_for_file(uploaded_file.id, current_user.id, db)
        if report:
            report.status = "failed"
            report.error_message = str(exc)
            db.commit()
            db.refresh(report)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Report generation failed: {exc}",
        ) from exc

    return _serialize_file_report(report)


@router.post("/{file_id}/chat", response_model=FileChatResponse)
def chat_with_uploaded_file(
    file_id: int,
    payload: FileChatRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploaded_file = db.get(UploadedFile, file_id)

    if uploaded_file is None or uploaded_file.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file was not found.",
        )

    if uploaded_file.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not ready for chat.",
        )

    if not uploaded_file.duckdb_table_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file does not have a query table yet.",
        )

    try:
        return generate_file_chat_response(uploaded_file, payload.message)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI chat failed: {exc}",
        ) from exc


@router.post("/{file_id}/query", response_model=FileQueryResponse)
def query_uploaded_file(
    file_id: int,
    payload: FileQueryRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    uploaded_file = db.get(UploadedFile, file_id)

    if uploaded_file is None or uploaded_file.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file was not found.",
        )

    if uploaded_file.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is not ready for querying.",
        )

    if not uploaded_file.duckdb_table_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file does not have a query table yet.",
        )

    try:
        rows = run_read_query(uploaded_file.duckdb_table_name, payload.query, payload.limit)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Query failed: {exc}",
        ) from exc

    columns = list(rows[0].keys()) if rows else []
    return FileQueryResponse(columns=columns, rows=rows, limit=payload.limit)


def _get_ready_owned_file(
    file_id: int,
    user_id: int,
    db: Session,
    action_name: str,
) -> UploadedFile:
    uploaded_file = db.get(UploadedFile, file_id)

    if uploaded_file is None or uploaded_file.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file was not found.",
        )

    if uploaded_file.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded file is not ready for {action_name}.",
        )

    if not uploaded_file.duckdb_table_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file does not have a query table yet.",
        )

    return uploaded_file


def _get_report_for_file(file_id: int, user_id: int, db: Session) -> FileReport | None:
    return (
        db.query(FileReport)
        .filter(
            FileReport.file_id == file_id,
            FileReport.user_id == user_id,
        )
        .one_or_none()
    )


def _serialize_file_report(report: FileReport) -> dict:
    return {
        "id": report.id,
        "fileId": report.file_id,
        "status": report.status,
        "report": report.report_json,
        "model": report.model,
        "errorMessage": report.error_message,
        "createdAt": report.created_at,
        "updatedAt": report.updated_at,
    }
