from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.uploaded_file import UploadedFile
from app.schemas.uploaded_file import FileUploadResponse, UploadedFileRead
from app.services.auth_service import get_current_user
from app.services.duckdb_service import drop_table_by_name, store_rows
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
