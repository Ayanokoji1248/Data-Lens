"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { authRequest } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    try {
      await authRequest("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="h-10 w-full rounded-lg border border-[#efc2c4] bg-[#fdebec] px-4 text-sm font-semibold text-[#9f2f2d] hover:border-[#9f2f2d] hover:bg-[#9f2f2d] hover:text-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Leaving" : "Logout"}
    </button>
  );
}
