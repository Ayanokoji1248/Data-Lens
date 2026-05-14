from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.services.auth_service import get_current_user

router = APIRouter()

ALLOWED_EXTENSIONS = {".csv", ".xls", ".xlsx"}


@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_file(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    extension = Path(file.filename or "").suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV, XLS, and XLSX files are supported.",
        )

    contents = await file.read()

    return {
        "message": "File received for processing.",
        "file": {
            "name": file.filename,
            "contentType": file.content_type,
            "size": len(contents),
            "status": "queued",
        },
        "userId": current_user.id,
    }
