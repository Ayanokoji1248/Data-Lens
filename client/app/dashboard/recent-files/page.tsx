import { FileClock } from "lucide-react";

export default function RecentFilesPage() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">
        Recent Files
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#171717]">
        Latest activity.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#62584e]">
        Recent uploads and analysis state across your workspace.
      </p>

      <article className="mt-8 rounded-xl border border-dashed border-[#d9d0c4] bg-[#fffdf8]/92 p-8 text-center shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#f7f1e8] text-[#7c6f5b]">
          <FileClock className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#1f2937]">
          No recent files.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#62584e]">
          Upload activity will appear here after your first spreadsheet is processed.
        </p>
      </article>
    </section>
  );
}
