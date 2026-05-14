"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  FileClock,
  Folder,
  LayoutDashboard,
  PanelsTopLeft,
  Settings,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const navigation: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/my-sheets", icon: Folder, label: "My Sheets" },
  { href: "/dashboard/ai-chat", icon: Bot, label: "AI Chat" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/dashboards", icon: PanelsTopLeft, label: "Dashboards" },
  { href: "/dashboard/recent-files", icon: FileClock, label: "Recent Files" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 grid gap-1">
      {navigation.map(({ href, icon: Icon, label }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium ${
              active
                ? "bg-[#1f2937] text-[#fbfaf7]"
                : "text-[#57534e] hover:bg-[#f2eee7] hover:text-[#1f2937]"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
