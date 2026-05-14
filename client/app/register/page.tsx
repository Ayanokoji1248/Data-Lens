import Link from "next/link";

import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="KnowYourSheet"
      title="Talk to your spreadsheets like they understand you."
      copy="Upload Excel, CSV, or Sheets and discover insights instantly."
      footer={
        <>
          Already have a workspace?{" "}
          <Link href="/login" className="font-semibold text-[#1f2937] hover:text-[#6f6254]">
            Login
          </Link>
        </>
      }
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
