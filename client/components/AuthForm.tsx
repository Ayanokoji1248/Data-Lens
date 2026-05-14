"use client";

import Link from "next/link";
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
  "mt-2 h-11 w-full rounded-lg border border-[#d8d0c4] bg-[#fffdf8] px-3.5 text-[15px] font-medium text-[#171717] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none placeholder:text-[#9a9186] hover:border-[#bdb3a5] focus:border-[#8f8375] focus:bg-white focus:shadow-[0_0_0_3px_rgba(143,131,117,0.13)] focus:outline-none focus-visible:outline-none";

const tabClass =
  "border-b-2 px-1 pb-2 text-sm font-semibold transition-colors duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)]";

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.44 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

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

  function handleGoogleClick() {
    setError("Google sign-in is not connected yet. Use email and password for now.");
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-[360px]" noValidate>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">
          {isRegister ? "Create workspace" : "Welcome back"}
        </p>
        <h2 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-[-0.035em] text-[#171717]">
          {isRegister ? "Create your account" : "Sign in"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#68625b]">
          {isRegister
            ? "Set up a workspace for spreadsheet questions, checks, and summaries."
            : "Continue to your spreadsheet workspace."}
        </p>
      </div>

      <div className="mb-6 flex gap-7 border-b border-[#ded6ca]">
        <Link
          href="/login"
          aria-current={!isRegister ? "page" : undefined}
          className={`${tabClass} ${
            !isRegister
              ? "border-[#1f2937] text-[#171717]"
              : "border-transparent text-[#8a8177] hover:text-[#171717]"
          }`}
        >
          Login
        </Link>
        <Link
          href="/register"
          aria-current={isRegister ? "page" : undefined}
          className={`${tabClass} ${
            isRegister
              ? "border-[#1f2937] text-[#171717]"
              : "border-transparent text-[#8a8177] hover:text-[#171717]"
          }`}
        >
          Register
        </Link>
      </div>

      <button
        type="button"
        onClick={handleGoogleClick}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-[#d8d0c4] bg-[#fffdf8] px-4 text-sm font-semibold text-[#292524] hover:border-[#bdb3a5] hover:bg-white focus-visible:outline-[#8f8375] active:scale-[0.99]"
      >
        <GoogleMark />
        Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#9a9186]">
        <span className="h-px flex-1 bg-[#ded6ca]" />
        or email
        <span className="h-px flex-1 bg-[#ded6ca]" />
      </div>

      <div className="space-y-3.5">
        {isRegister ? (
          <label className="block text-sm font-semibold text-[#3f3a35]">
            Full name
            <input
              className={inputClass}
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Maya Rao"
              required
              minLength={2}
            />
          </label>
        ) : null}

        <label className="block text-sm font-semibold text-[#3f3a35]">
          Email
          <input
            className={inputClass}
            name="email"
            type="email"
            autoComplete="email"
            placeholder="maya@company.com"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-[#3f3a35]">
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
      </div>

      <div className="mt-4 min-h-6">
        {error ? (
          <p className="rounded-lg border border-[#efc2c4] bg-[#fdebec] px-3 py-2 text-sm font-medium text-[#9f2f2d]">
            {error}
          </p>
        ) : !isRegister ? (
          <Link
            href="/login#forgot-password"
            className="text-sm font-semibold text-[#57534e] hover:text-[#171717]"
          >
            Forgot password?
          </Link>
        ) : (
          <p className="text-sm text-[#78716c]">You can invite teammates later.</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-[#1f2937] px-4 text-sm font-semibold text-[#faf7ef] hover:bg-[#111827] focus-visible:outline-[#8f8375] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Working..." : isRegister ? "Create account" : "Enter workspace"}
      </button>
    </form>
  );
}
