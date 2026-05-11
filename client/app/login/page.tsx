import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Secure workspace"
      title="Read the room before the room changes."
      copy="Sign in to continue into your protected Data Lens dashboard."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-semibold text-ink underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
