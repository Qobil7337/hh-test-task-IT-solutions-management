import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import type { User } from "@/lib/types";
import { LogoutButton } from "./logout-button";
import { RoleBadge } from "./role-badge";

const linkClass = "hover:text-zinc-900";

/**
 * Session-aware part of the site header: sign-in link for visitors, account
 * link (plus the admin area for administrators) and sign-out for users. If
 * the API is unreachable it shows the signed-out state; the page itself
 * reports the outage.
 */
export async function SiteNav() {
  let user: User | null = null;
  try {
    user = await getSessionUser();
  } catch {
    user = null;
  }

  if (!user) {
    return (
      <Link href="/login" className={linkClass}>
        Sign in
      </Link>
    );
  }

  return (
    <>
      {user.role === "ADMIN" && (
        <Link href="/admin" className={linkClass}>
          Admin
        </Link>
      )}
      <Link
        href="/account"
        title="My account"
        className={`inline-flex items-center gap-2 ${linkClass}`}
      >
        <span className="font-medium text-zinc-900">{user.name}</span>
        <RoleBadge role={user.role} />
      </Link>
      <LogoutButton redirectTo="/" className={linkClass} />
    </>
  );
}
