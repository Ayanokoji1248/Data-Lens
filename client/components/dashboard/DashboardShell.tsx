import type { ReactNode } from "react";
import { Sheet } from "lucide-react";

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

      <div className="relative min-h-screen lg:pl-[248px]">
        <aside className="flex flex-col border-b border-[#e4ded4] bg-[#fbfaf7]/88 px-5 py-5 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-[248px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-4">
          <div>
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
          </div>

          <div className="mt-8 border-t border-[#e4ded4] pt-5 lg:mt-auto">
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#ded7cc] bg-[#fffdf8]/88 p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#1f2937] text-sm font-semibold text-[#fbfaf7]">
                {initials || "A"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1f2937]">{user.fullName}</p>
                <p className="truncate text-xs text-[#78716c]">{user.email}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-7 lg:py-10">{children}</div>
        </section>
      </div>
    </main>
  );
}
