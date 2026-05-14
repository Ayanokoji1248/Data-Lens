import { UploadFileCard } from "@/components/dashboard/UploadFileCard";
import { requireCurrentUser } from "@/lib/server-auth";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const firstName = user.fullName?.split(" ")[0] || "there";

  return (
    <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">
          Dashboard
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] text-[#171717] sm:text-5xl">
          Good evening, {firstName}.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[#62584e]">
          Upload a spreadsheet and ask questions about revenue, quality, missing values, trends,
          and summaries in one workspace.
        </p>

        <div className="mt-8 rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 p-4 shadow-[0_18px_50px_rgba(65,50,35,0.05)] sm:p-6">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#1f2937]">
              Upload a file
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6b6259]">
              Drop an Excel or CSV file here. KnowYourSheet will prepare it for chat, summaries,
              and validation checks.
            </p>
          </div>

          <UploadFileCard />
        </div>
      </div>

      <aside className="space-y-4">
        <section className="rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 p-5 shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
          <h2 className="text-sm font-semibold text-[#1f2937]">Workspace status</h2>
          <p className="mt-3 text-sm leading-6 text-[#62584e]">
            Upload your first spreadsheet to generate summaries, file status, and AI-ready
            context.
          </p>
        </section>

        <section className="rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 p-5 shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1f2937]">Recent files</h2>
            <span className="text-xs text-[#78716c]">0 files</span>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-[#d9d0c4] bg-[#fbfaf7] p-4">
            <p className="text-sm font-medium text-[#292524]">No files uploaded yet.</p>
            <p className="mt-1 text-sm leading-6 text-[#78716c]">
              Recent workbooks will appear here after upload.
            </p>
          </div>
        </section>
      </aside>
    </section>
  );
}
