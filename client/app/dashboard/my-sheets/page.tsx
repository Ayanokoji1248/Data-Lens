import { FileSpreadsheet } from "lucide-react";

export default function MySheetsPage() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">My Sheets</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#171717]">
        Uploaded workbooks.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#62584e]">
        Keep track of uploaded files, processing state, and the analysis context available to AI.
      </p>

      <article className="mt-8 rounded-xl border border-dashed border-[#d9d0c4] bg-[#fffdf8]/92 p-8 text-center shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#edf3ec] text-[#346538]">
          <FileSpreadsheet className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#1f2937]">
          No sheets yet.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#62584e]">
          Uploaded spreadsheets will appear here with their processing state and AI context.
        </p>
      </article>
    </section>
  );
}
