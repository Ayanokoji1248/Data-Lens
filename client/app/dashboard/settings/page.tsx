import { requireCurrentUser } from "@/lib/server-auth";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  return (
    <section className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7c6f5b]">Settings</p>
      <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#171717]">
        Workspace settings.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-[#62584e]">
        Manage defaults for uploaded spreadsheets, privacy, and AI-generated summaries.
      </p>

      <div className="mt-8 divide-y divide-[#ebe5dc] rounded-xl border border-[#ded7cc] bg-[#fffdf8]/92 shadow-[0_18px_50px_rgba(65,50,35,0.04)]">
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-[#292524]">Full name</p>
          <p className="mt-1 text-sm text-[#78716c]">{user.fullName}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-[#292524]">Email</p>
          <p className="mt-1 text-sm text-[#78716c]">{user.email}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-[#292524]">Role</p>
          <p className="mt-1 text-sm text-[#78716c]">{user.role || "Member"}</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm font-semibold text-[#292524]">Workspace preferences</p>
          <p className="mt-1 text-sm leading-6 text-[#78716c]">
            Preferences will appear here when configurable workspace settings are added.
          </p>
        </div>
      </div>
    </section>
  );
}
