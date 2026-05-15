import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FileWorkspace } from "@/components/dashboard/FileWorkspace";
import { getFilePreview } from "@/lib/server-files";

type FileDetailPageProps = {
  params: Promise<{
    fileId: string;
  }>;
};

export default async function FileDetailPage({ params }: FileDetailPageProps) {
  const { fileId } = await params;
  const { preview, error } = await getFilePreview(fileId, 20);

  if (error || !preview) {
    return (
      <section>
        <Link
          href="/dashboard/my-sheets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#62584e] hover:text-[#1f2937]"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Back to My Sheets
        </Link>
        <div className="mt-8 rounded-xl border border-[#f0c7c2] bg-[#fff4f2] p-6">
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#1f2937]">
            File preview unavailable.
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#9f2f2d]">
            {error ?? "Could not load this file preview."}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/dashboard/my-sheets"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#62584e] hover:text-[#1f2937]"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
            Back to My Sheets
          </Link>
          <h1 className="mt-3 truncate font-serif text-4xl font-semibold tracking-[-0.04em] text-[#171717]">
            {preview.file.originalFilename}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#62584e]">
          <span className="rounded-lg border border-[#ded7cc] bg-[#fffdf8]/92 px-3 py-2">
            {preview.file.rowCount ?? 0} rows
          </span>
          <span className="rounded-lg border border-[#ded7cc] bg-[#fffdf8]/92 px-3 py-2">
            {preview.file.columnCount ?? 0} columns
          </span>
          <span className="rounded-lg border border-[#ded7cc] bg-[#fffdf8]/92 px-3 py-2 capitalize">
            {preview.file.status}
          </span>
        </div>
      </div>

      <FileWorkspace preview={preview} />
    </section>
  );
}
