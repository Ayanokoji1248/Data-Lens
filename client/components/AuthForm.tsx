"use client";

"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { authRequest } from "@/lib/api";

type AuthFormProps = {
  mode: "login" | "register";
};

type LoginResponse = {
  message: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role?: string | null;
  };
};

const inputClass =
  "mt-2 h-12 w-full border border-black/15 bg-white px-4 text-base text-ink shadow-inner shadow-black/[0.03] placeholder:text-black/35 hover:border-black/30 focus:border-signal";

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      if (isRegister) {
        await authRequest("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({
            fullName: String(formData.get("fullName") ?? ""),
            email,
            password,
            role: String(formData.get("role") ?? "") || undefined,
          }),
        });
      }

      await authRequest<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-copper">
          {isRegister ? "Create access" : "Welcome back"}
        </p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-ink">
          {isRegister ? "Register account" : "Login"}
        </h2>
      </div>

      <div className="space-y-5">
        {isRegister ? (
          <label className="block text-sm font-medium text-black/70">
            Full name
            <input
              className={inputClass}
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              required
              minLength={2}
            />
          </label>
        ) : null}

        <label className="block text-sm font-medium text-black/70">
          Email
          <input
            className={inputClass}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="jane@example.com"
            required
          />
        </label>

        <label className="block text-sm font-medium text-black/70">
          Password
          <input
            className={inputClass}
            name="password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder="Minimum 8 characters"
            required
            minLength={8}
          />
        </label>

        {isRegister ? (
          <label className="block text-sm font-medium text-black/70">
            Role
            <input
              className={inputClass}
              name="role"
              type="text"
              autoComplete="organization-title"
              placeholder="Analyst, Admin, Viewer"
            />
          </label>
        ) : null}
      </div>

      {error ? (
        <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-7 flex h-12 w-full items-center justify-center bg-ink px-5 font-mono text-sm uppercase tracking-[0.18em] text-paper shadow-[0_12px_30px_rgba(22,21,18,.22)] hover:-translate-y-0.5 hover:bg-fern disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Working..." : isRegister ? "Create account" : "Enter dashboard"}
      </button>
    </form>
  );
}
