import { AlertCircle, CheckCircle2, Clock3, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

import type { ApiUploadedFile } from "@/lib/api";

type FileListProps = {
  files: ApiUploadedFile[];
  emptyTitle: string;
  emptyDescription: string;
  compact?: boolean;
  errorMessage?: string | null;
  getFileHref?: (file: ApiUploadedFile) => string;
};

const statusStyles: Record<string, string> = {
  ready: "bg-[#edf3ec] text-[#346538]",
  processing: "bg-[#f7f1e8] text-[#7c6f5b]",
  queued: "bg-[#f7f1e8] text-[#7c6f5b]",
  failed: "bg-[#f9e8e6] text-[#9f2f2d]",
};

const fileDateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  return fileDateFormatter.format(new Date(value));
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ready") {
    return <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />;
  }

  if (status === "failed") {
    return <AlertCircle className="h-4 w-4" strokeWidth={1.8} />;
  }

  return <Clock3 className="h-4 w-4" strokeWidth={1.8} />;
}

function FileListItem({ file, href }: { file: ApiUploadedFile; href?: string }) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#edf3ec] text-[#346538]">
        <FileSpreadsheet className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-[#1f2937]">
            {file.originalFilename}
          </h2>
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold capitalize ${
              statusStyles[file.status] ?? "bg-[#f7f1e8] text-[#7c6f5b]"
            }`}
          >
            <StatusIcon status={file.status} />
            {file.status}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#78716c]">
          {formatFileSize(file.sizeBytes)} - Uploaded {formatDate(file.createdAt)}
        </p>
        <p className="mt-1 text-xs leading-5 text-[#62584e]">
          {file.rowCount ?? 0} rows - {file.columnCount ?? 0} columns
          {file.duckdbTableName ? ` - ${file.duckdbTableName}` : ""}
        </p>
        {file.errorMessage ? (
          <p className="mt-2 text-xs leading-5 text-[#9f2f2d]">{file.errorMessage}</p>
        ) : null}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 p-4 shadow-[0_18px_50px_rgba(65,50,35,0.04)] transition hover:border-[#bfb5a8] hover:bg-[#fffaf0]"
      >
        {content}
      </Link>
    );
  }

  return (
    <article className="rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 p-4 shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
      {content}
    </article>
  );
}

export function FileList({
  files,
  emptyTitle,
  emptyDescription,
  compact = false,
  errorMessage = null,
  getFileHref,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div>
        {errorMessage ? (
          <p className="mb-3 rounded-lg border border-[#f0c7c2] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#9f2f2d]">
            {errorMessage}
          </p>
        ) : null}
        <article className="rounded-xl border border-dashed border-[#d9d0c4] bg-[#fffdf8]/92 p-8 text-center shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#edf3ec] text-[#346538]">
            <FileSpreadsheet className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#1f2937]">
            {emptyTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#62584e]">
            {emptyDescription}
          </p>
        </article>
      </div>
    );
  }

  const visibleFiles = compact ? files.slice(0, 4) : files;

  return (
    <div className={compact ? "space-y-3" : "mt-8 grid gap-3"}>
      {errorMessage ? (
        <p className="rounded-lg border border-[#f0c7c2] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#9f2f2d]">
          {errorMessage}
        </p>
      ) : null}
      {visibleFiles.map((file) => (
        <FileListItem key={file.id} file={file} href={getFileHref?.(file)} />
      ))}
    </div>
  );
}
