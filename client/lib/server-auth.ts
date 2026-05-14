import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { API_URL, type ApiUser } from "@/lib/api";

export const getCurrentUser = cache(async (): Promise<ApiUser | null> => {
  const cookieHeader = (await cookies()).toString();

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/users/me`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
