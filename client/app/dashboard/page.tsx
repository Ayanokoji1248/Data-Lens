import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/LogoutButton";
import { API_URL, type ApiUser } from "@/lib/api";

async function getCurrentUser(): Promise<ApiUser | null> {
  const cookieHeader = (await cookies()).toString();

  let response: Response;

  try {
    response = await fetch(`${API_URL}/api/users/me`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const joined = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(user.created_at));

  return (
    <main className="min-h-screen bg-[#f6f3ec] px-5 py-6 text-ink sm:px-8 lg:px-10">
      <section className="mx-auto min-h-[calc(100vh-3rem)] max-w-6xl border border-black/10 bg-paper shadow-[0_30px_80px_rgba(33,29,20,0.14)]">
        <header className="flex flex-col gap-5 border-b border-black/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.28em] text-copper">
              Data Lens
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
          </div>
          <LogoutButton />
        </header>

        <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="border-b border-black/10 p-6 lg:border-b-0 lg:border-r lg:p-10">
            <div className="bg-[#151511] p-7 text-[#fff7e8]">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-[#f2b56b]">
                Active user
              </p>
              <h2 className="mt-5 text-4xl font-semibold leading-tight">{user.fullName}</h2>
              <p className="mt-3 text-[#d9d2c3]">{user.email}</p>
              <div className="mt-8 grid grid-cols-2 gap-px bg-white/10">
                <div className="bg-[#151511] p-4">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#b9b09f]">
                    Role
                  </div>
                  <div className="mt-2 text-lg">{user.role || "Member"}</div>
                </div>
                <div className="bg-[#151511] p-4">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#b9b09f]">
                    Joined
                  </div>
                  <div className="mt-2 text-lg">{joined}</div>
                </div>
              </div>
            </div>
          </aside>

          <section className="p-6 lg:p-10">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Protected", "route state"],
                ["Cookie", "auth mode"],
                ["Postgres", "user store"],
              ].map(([value, label]) => (
                <div key={label} className="border border-black/10 bg-white p-5">
                  <div className="text-2xl font-semibold">{value}</div>
                  <div className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-black/45">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border border-black/10 bg-white p-6">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-fern">
                Protected payload
              </p>
              <pre className="mt-5 overflow-x-auto bg-[#151511] p-5 text-sm leading-7 text-[#fff7e8]">
                {JSON.stringify(
                  {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
