import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { RoleBadge } from "@/components/role-badge";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Admin" };

// Every /admin page: sign-in required, ADMIN role required. This only decides
// what to render — the API enforces the role on each management mutation.
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = await requireUser("/admin");
  if (user.role !== "ADMIN") return <AdminForbidden name={user.name} />;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <nav className="flex flex-wrap items-center gap-5 text-sm">
          <span className="text-xs font-medium uppercase tracking-widest text-amber-700">
            Admin
          </span>
          <Link href="/admin" className="text-zinc-600 hover:text-zinc-900">
            Dashboard
          </Link>
          <Link
            href="/admin/campaigns/new"
            className="text-zinc-600 hover:text-zinc-900"
          >
            New campaign
          </Link>
        </nav>
        <p className="inline-flex items-center gap-2 text-sm text-zinc-500">
          {user.name} <RoleBadge role={user.role} />
        </p>
      </div>
      {children}
    </div>
  );
}

function AdminForbidden({ name }: { name: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
      <h1 className="text-xl font-semibold">Administrators only</h1>
      <p className="mt-2 text-sm">
        You are signed in as {name} with the USER role. Campaign management
        requires an ADMIN account — the seeded admin credentials are listed in
        the README and on the sign-in page.
      </p>
      <Link
        href="/campaigns"
        className="mt-6 inline-block text-sm font-medium underline underline-offset-4"
      >
        ← Back to campaigns
      </Link>
    </div>
  );
}
