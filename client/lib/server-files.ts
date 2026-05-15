import { cookies } from "next/headers";

import { API_URL, type ApiFilePreview, type ApiUploadedFile } from "@/lib/api";

export type UploadedFilesResult = {
  files: ApiUploadedFile[];
  error: string | null;
};

export type FilePreviewResult = {
  preview: ApiFilePreview | null;
  error: string | null;
};

export async function getUploadedFiles(): Promise<UploadedFilesResult> {
  const cookieHeader = (await cookies()).toString();

  try {
    const response = await fetch(`${API_URL}/api/files`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        files: [],
        error: "Could not load uploaded files.",
      };
    }

    return {
      files: await response.json(),
      error: null,
    };
  } catch {
    return {
      files: [],
      error: "Could not connect to the files API.",
    };
  }
}

export async function getFilePreview(fileId: string, limit = 20): Promise<FilePreviewResult> {
  const cookieHeader = (await cookies()).toString();

  try {
    const response = await fetch(`${API_URL}/api/files/${fileId}/preview?limit=${limit}`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        preview: null,
        error:
          payload && typeof payload.detail === "string"
            ? payload.detail
            : "Could not load file preview.",
      };
    }

    return {
      preview: payload,
      error: null,
    };
  } catch {
    return {
      preview: null,
      error: "Could not connect to the file preview API.",
    };
  }
}
