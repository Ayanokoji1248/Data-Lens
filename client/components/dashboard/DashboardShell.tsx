import type { ReactNode } from "react";
import { Bell, Search, Sheet } from "lucide-react";

import { LogoutButton } from "@/components/LogoutButton";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import type { ApiUser } from "@/lib/api";

type DashboardShellProps = {
  children: ReactNode;
  user: ApiUser;
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f4ee] text-[#171717]">
      <div className="pointer-events-none absolute left-[-12rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-[#eadfce]/70 blur-3xl" />
      <div className="pointer-events-none absolute right-[-10rem] top-24 h-[24rem] w-[24rem] rounded-full bg-[#dfe8ed]/55 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-16rem] left-1/3 h-[30rem] w-[30rem] rounded-full bg-[#eee6d8]/70 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.24] [background-image:radial-gradient(rgba(31,41,55,.09)_1px,transparent_1px)] [background-size:18px_18px]" />

      <div className="relative grid min-h-screen lg:grid-cols-[248px_minmax(0,1fr)]">
        <aside className="border-b border-[#e4ded4] bg-[#fbfaf7]/88 px-5 py-5 backdrop-blur-xl lg:border-b-0 lg:border-r lg:px-4">
          <div className="flex items-center gap-3 px-1">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[#1f2937] text-[#fbfaf7]">
              <Sheet className="h-[18px] w-[18px]" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[-0.01em] text-[#1f2937]">
                KnowYourSheet
              </p>
              <p className="text-xs text-[#78716c]">Spreadsheet intelligence</p>
            </div>
          </div>

          <DashboardNav />

          <div className="mt-8 hidden lg:block">
            <LogoutButton />
          </div>
        </aside>

        <section className="min-w-0">
          <header className="border-b border-[#e4ded4] bg-[#fbfaf7]/82 px-5 py-4 backdrop-blur-xl sm:px-7">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <label className="flex h-11 min-w-0 flex-1 items-center rounded-lg border border-[#ded7cc] bg-[#fffdf8]/88 px-3.5 lg:max-w-xl">
                <Search className="mr-3 h-4 w-4 text-[#8f8375]" strokeWidth={1.8} />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#292524] outline-none placeholder:text-[#9a9186]"
                  placeholder="Ask your sheet anything..."
                  aria-label="Ask your sheet anything"
                />
              </label>

              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <button className="h-11 rounded-lg border border-[#ded7cc] bg-[#fffdf8]/88 px-3.5 text-sm font-medium text-[#57534e] hover:border-[#c9beb0] hover:text-[#1f2937]">
                  Workspace
                </button>
                <button
                  className="grid h-11 w-11 place-items-center rounded-lg border border-[#ded7cc] bg-[#fffdf8]/88 text-[#57534e] hover:border-[#c9beb0] hover:text-[#1f2937]"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" strokeWidth={1.8} />
                </button>
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#1f2937] text-sm font-semibold text-[#fbfaf7]">
                  {initials || "A"}
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-7 lg:py-10">{children}</div>
        </section>
      </div>
    </main>
  );
}
