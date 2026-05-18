from datetime import datetime
from typing import Any, Literal

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


class FilePreviewResponse(BaseModel):
    file: UploadedFileRead
    columns: list[dict[str, Any]]
    rows: list[dict[str, Any]]
    limit: int

    model_config = ConfigDict(populate_by_name=True)


class FileQueryRequest(BaseModel):
    query: str
    limit: int = Field(default=20, ge=1, le=100)


class FileQueryResponse(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    limit: int

    model_config = ConfigDict(populate_by_name=True)


class FileChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class FileChatSummary(BaseModel):
    filename: str
    sheet_names: list[str] = Field(alias="sheetNames")
    row_count: int = Field(alias="rowCount")
    column_count: int = Field(alias="columnCount")
    columns: list[dict[str, Any]]

    model_config = ConfigDict(populate_by_name=True)


class FileChatResponse(BaseModel):
    answer: str | None = None
    sql: str | None = None
    operation: Literal["answer", "sql"]
    summary: FileChatSummary

    model_config = ConfigDict(populate_by_name=True)


class FileReportSection(BaseModel):
    title: str
    content: str


class FileReportContent(BaseModel):
    title: str
    executive_summary: str = Field(alias="executiveSummary")
    sections: list[FileReportSection]

    model_config = ConfigDict(populate_by_name=True)


class FileReportResponse(BaseModel):
    id: int
    file_id: int = Field(alias="fileId")
    status: str
    report: FileReportContent | None = None
    model: str | None = None
    error_message: str | None = Field(default=None, alias="errorMessage")
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


ChartType = Literal["bar", "donut", "line", "histogram"]
ChartAggregation = Literal["count", "sum", "avg", "min", "max"]


class FileChartSuggestion(BaseModel):
    title: str
    chart_type: ChartType = Field(alias="chartType")
    dimension: str
    measure: str | None = None
    aggregation: ChartAggregation
    limit: int = Field(default=20, ge=1, le=50)

    model_config = ConfigDict(populate_by_name=True)


class FileChartSuggestionsResponse(BaseModel):
    suggestions: list[FileChartSuggestion]

    model_config = ConfigDict(populate_by_name=True)


class FileChartQueryRequest(BaseModel):
    chart_type: ChartType = Field(alias="chartType")
    dimension: str
    measure: str | None = None
    aggregation: ChartAggregation = "count"
    limit: int = Field(default=20, ge=1, le=50)

    model_config = ConfigDict(populate_by_name=True)


class FileChartDataPoint(BaseModel):
    label: str
    value: float | int


class FileChartQueryResponse(BaseModel):
    title: str
    chart_type: ChartType = Field(alias="chartType")
    data: list[FileChartDataPoint]

    model_config = ConfigDict(populate_by_name=True)
