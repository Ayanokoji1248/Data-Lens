import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireCurrentUser } from "@/lib/server-auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
