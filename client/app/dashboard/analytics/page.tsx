import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">Analytics</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#171717]">
        Workbook health and trends.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#62584e]">
        Review data quality, detected movement, and the latest signals from uploaded spreadsheets.
      </p>

      <article className="mt-8 rounded-xl border border-dashed border-[#d9d0c4] bg-[#fffdf8]/92 p-8 text-center shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-[#f7f1e8] text-[#7c6f5b]">
          <BarChart3 className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#1f2937]">
          No analytics yet.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#62584e]">
          Workbook health, trend detection, and data quality metrics will appear after upload.
        </p>
      </article>
    </section>
  );
}
