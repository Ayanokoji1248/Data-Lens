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
      className="h-10 border border-black/15 px-4 font-mono text-xs uppercase tracking-[0.16em] text-ink hover:border-ink hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Leaving" : "Logout"}
    </button>
  );
}
