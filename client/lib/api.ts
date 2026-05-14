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
