from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, computed_field


class UploadedFileRead(BaseModel):
    id: int
    original_filename: str = Field(alias="originalFilename")
    stored_filename: str = Field(alias="storedFilename")
    content_type: str | None = Field(alias="contentType")
    size_bytes: int = Field(alias="sizeBytes")
    extension: str
    status: str
    duckdb_table_name: str | None = Field(default=None, alias="duckdbTableName")
    columns_metadata: dict[str, Any] | None = Field(default=None, alias="columnsMetadata")
    row_count: int | None = Field(default=None, alias="rowCount")
    column_count: int | None = Field(default=None, alias="columnCount")
    sheet_count: int | None = Field(default=None, alias="sheetCount")
    error_message: str | None = Field(default=None, alias="errorMessage")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @computed_field
    @property
    def name(self) -> str:
        return self.original_filename

    @computed_field
    @property
    def size(self) -> int:
        return self.size_bytes


class FileUploadResponse(BaseModel):
    message: str
    file: UploadedFileRead
    user_id: int = Field(alias="userId")

    model_config = ConfigDict(populate_by_name=True)
