import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  copy: string;
  footer: ReactNode;
};

const metrics = [
  ["14", "active lenses"],
  ["98%", "signal quality"],
  ["7m", "avg. review"],
];

export function AuthShell({ children, eyebrow, title, copy, footer }: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f3ec] px-5 py-6 text-ink sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl grid-cols-1 border border-black/10 bg-paper shadow-[0_30px_80px_rgba(33,29,20,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-[#151511] p-8 text-[#fff7e8] sm:p-10 lg:p-12">
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:38px_38px]" />
          <div className="absolute right-0 top-0 h-full w-1/3 bg-[linear-gradient(180deg,rgba(182,103,55,.65),rgba(49,92,72,.45),transparent)]" />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link href="/login" className="font-mono text-sm uppercase tracking-[0.28em]">
              Data Lens
            </Link>
            <div className="h-3 w-3 rounded-full bg-[#f2b56b] shadow-[0_0_24px_rgba(242,181,107,.85)]" />
          </div>

          <div className="relative z-10 max-w-xl py-14">
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-[#f2b56b]">
              {eyebrow}
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[0.95] text-balance sm:text-6xl lg:text-7xl">
              {title}
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[#d9d2c3] sm:text-lg">
              {copy}
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 border border-white/12 bg-white/[0.04]">
            {metrics.map(([value, label]) => (
              <div key={label} className="border-r border-white/12 p-4 last:border-r-0">
                <div className="font-mono text-2xl text-[#fffaf0]">{value}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-[#b9b09f]">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
          <div className="w-full max-w-md">
            {children}
            <div className="mt-7 text-center text-sm text-black/60">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
