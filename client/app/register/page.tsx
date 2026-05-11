import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="New analyst"
      title="Shape raw signals into decisions."
      copy="Create your account and enter the protected dashboard in one clean step."
      footer={
        <>
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
            Login instead
          </Link>
        </>
      }
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
