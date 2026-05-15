import { FileList } from "@/components/dashboard/FileList";
import { UploadFileCard } from "@/components/dashboard/UploadFileCard";
import { requireCurrentUser } from "@/lib/server-auth";
import { getUploadedFiles } from "@/lib/server-files";

export default async function DashboardPage() {
  const [user, uploadedFilesResult] = await Promise.all([requireCurrentUser(), getUploadedFiles()]);
  const { files, error: filesError } = uploadedFilesResult;
  const firstName = user.fullName?.split(" ")[0] || "there";
  const readyFiles = files.filter((file) => file.status === "ready").length;

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
            {files.length > 0
              ? `${readyFiles} of ${files.length} uploaded CSV files are ready for analysis.`
              : "Upload your first spreadsheet to generate summaries, file status, and AI-ready context."}
          </p>
        </section>

        <section className="rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 p-5 shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1f2937]">Recent files</h2>
            <span className="text-xs text-[#78716c]">
              {files.length} {files.length === 1 ? "file" : "files"}
            </span>
          </div>
          <div className="mt-4">
            <FileList
              files={files}
              compact
              emptyTitle="No files uploaded yet."
              emptyDescription="Recent CSV uploads will appear here after upload."
              errorMessage={filesError}
            />
          </div>
        </section>
      </aside>
    </section>
  );
}
