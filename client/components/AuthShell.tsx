import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  copy: string;
  footer: ReactNode;
};

const rows = [
  ["North", "$48.2k", "+12.4%", "steady"],
  ["West", "$31.8k", "-4.1%", "review"],
  ["Central", "$42.6k", "+7.8%", "strong"],
];

export function AuthShell({ children, copy, eyebrow, footer, title }: AuthShellProps) {
  return (
    <main className="min-h-[100dvh] bg-[#f8f5ee] text-[#171717]">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(420px,480px)]">
        <section className="relative flex min-h-[48dvh] flex-col justify-between px-5 py-7 sm:px-8 lg:min-h-[100dvh] lg:px-12 lg:py-10 xl:px-16">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-0 top-0 h-full w-px bg-[#e7dfd2]" />
            <div className="absolute right-0 top-0 hidden h-full w-px bg-[#e7dfd2] lg:block" />
            <div className="absolute bottom-10 left-6 right-6 h-px bg-[#ebe4d8] lg:left-12 lg:right-12 xl:left-16 xl:right-16" />
            <div className="absolute -left-20 bottom-[-18rem] h-[32rem] w-[32rem] rounded-full bg-[#ece2d0]/60 blur-3xl" />
            <div className="absolute right-[12%] top-14 h-40 w-40 rounded-full bg-[#dce7ef]/45 blur-3xl" />
          </div>

          <header className="relative z-10 flex items-center justify-between">
            <Link href="/login" className="inline-flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1f2937] text-sm font-semibold text-[#faf7ef]">
                K
              </span>
              <span className="text-sm font-semibold tracking-[-0.01em] text-[#1f2937]">
                KnowYourSheet
              </span>
            </Link>
            <span className="hidden text-xs font-medium text-[#78716c] sm:inline">
              Spreadsheet intelligence
            </span>
          </header>

          <div className="relative z-10 max-w-3xl py-10 lg:py-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">
              {eyebrow}
            </p>
            <h1 className="mt-5 max-w-2xl font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.04em] text-[#171717] text-balance sm:text-6xl xl:text-7xl">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#57534e] sm:text-lg">
              {copy}
            </p>
          </div>

          <div className="relative z-10 hidden max-w-2xl lg:block">
            <div className="mb-4 flex items-center justify-between text-xs text-[#78716c]">
              <span className="font-medium">Workbook summary</span>
              <span className="font-mono">Q2_revenue.csv</span>
            </div>
            <div className="divide-y divide-[#e5ded2] border-y border-[#e5ded2]">
              {rows.map(([region, revenue, change, status]) => (
                <div
                  key={region}
                  className="grid grid-cols-[1fr_1fr_1fr_0.8fr] items-center py-3 text-sm"
                >
                  <span className="font-medium text-[#292524]">{region}</span>
                  <span className="font-mono text-[#44403c]">{revenue}</span>
                  <span
                    className={
                      change.startsWith("+")
                        ? "font-mono text-[#346538]"
                        : "font-mono text-[#9f2f2d]"
                    }
                  >
                    {change}
                  </span>
                  <span className="text-right text-[#78716c]">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center px-5 pb-8 pt-8 sm:px-8 sm:pt-10 lg:min-h-[100dvh] lg:border-l lg:border-[#e7dfd2] lg:px-12 lg:py-10">
          <div className="w-full">
            {children}
            <div className="mx-auto mt-6 w-full max-w-[360px] text-sm text-[#78716c]">
              {footer}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
