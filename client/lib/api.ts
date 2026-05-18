const apiPort = process.env.NEXT_PUBLIC_API_PORT ?? "8000";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? `http://127.0.0.1:${apiPort}`;

function getApiUrl() {
  if (typeof window !== "undefined" && !process.env.NEXT_PUBLIC_API_URL) {
    return `${window.location.protocol}//${window.location.hostname}:${apiPort}`;
  }

  return API_URL;
}

export type ApiUser = {
  id: number;
  fullName: string;
  email: string;
  role?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiUploadedFile = {
  id: number;
  originalFilename: string;
  storedFilename: string;
  contentType: string | null;
  sizeBytes: number;
  extension: string;
  status: string;
  duckdbTableName?: string | null;
  columnsMetadata?: {
    columns?: Array<{
      originalName: string;
      storedName: string;
      position: number;
      inferredType?: string;
      nullCount?: number;
      sampleValues?: unknown[];
    }>;
    sheetNames?: string[];
  } | null;
  rowCount: number | null;
  columnCount: number | null;
  sheetCount: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  name?: string;
  size?: number;
};

export type ApiFilePreview = {
  file: ApiUploadedFile;
  columns: Array<{
    originalName: string;
    storedName: string;
    position: number;
    inferredType?: string;
    nullCount?: number;
    sampleValues?: unknown[];
  }>;
  rows: Record<string, unknown>[];
  limit: number;
};

export type ApiFileQueryResult = {
  columns: string[];
  rows: Record<string, unknown>[];
  limit: number;
};

export type ApiFileChatResponse = {
  answer: string | null;
  sql: string | null;
  operation: "answer" | "sql";
  summary: {
    filename: string;
    sheetNames: string[];
    rowCount: number;
    columnCount: number;
    columns: Array<{
      originalName: string;
      storedName: string;
      position: number;
      inferredType?: string;
      nullCount?: number;
      sampleValues?: unknown[];
    }>;
  };
};

export type ApiFileReportResponse = {
  id: number;
  fileId: number;
  status: string;
  report: {
    title: string;
    executiveSummary: string;
    sections: Array<{
      title: string;
      content: string;
    }>;
  } | null;
  model: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiChartType = "bar" | "donut" | "line" | "histogram";

export type ApiChartSuggestion = {
  title: string;
  chartType: ApiChartType;
  dimension: string;
  measure: string | null;
  aggregation: "count" | "sum" | "avg" | "min" | "max";
  limit: number;
};

export type ApiChartSuggestionsResponse = {
  suggestions: ApiChartSuggestion[];
};

export type ApiChartQueryResponse = {
  title: string;
  chartType: ApiChartType;
  data: Array<{
    label: string;
    value: number;
  }>;
};

export async function authRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.detail === "string"
        ? payload.detail
        : "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return payload as T;
}

export async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload.detail === "string"
        ? payload.detail
        : "Upload failed. Please try again.";
    throw new Error(message);
  }

  return payload as T;
}
