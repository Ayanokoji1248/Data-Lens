import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="KnowYourSheet"
      title="Talk to your spreadsheets like they understand you."
      copy="Upload Excel, CSV, or Sheets and discover insights instantly."
      footer={
        <>
          New to KnowYourSheet?{" "}
          <Link href="/register" className="font-semibold text-[#1f2937] hover:text-[#6f6254]">
            Create an account
          </Link>
        </>
      }
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
