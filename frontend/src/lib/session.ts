// Request-scoped session helpers for Server Components and Server Actions.
import { redirect } from "next/navigation";
import { cache } from "react";
import { getCurrentUser } from "./api";
import { getToken } from "./auth";
import type { User } from "./types";

export interface Session {
  token: string;
  user: User;
}

/**
 * The signed-in session for the current request, or null without a valid
 * token. Memoised per request, so the header and the page share one `me`
 * query. Throws when the API is unreachable — pages report that through
 * their error boundary.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = await getToken();
  if (!token) return null;
  const user = await getCurrentUser(token);
  return user ? { token, user } : null;
});

export async function getSessionUser(): Promise<User | null> {
  return (await getSession())?.user ?? null;
}

/** Only same-site paths may be used as return targets (no open redirects). */
export function safeReturnPath(value: string, fallback: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function loginPath(returnTo: string): string {
  return `/login?next=${encodeURIComponent(returnTo)}`;
}

/** Sends visitors without a session to the sign-in page, and back afterwards. */
export async function requireUser(returnTo: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(loginPath(returnTo));
  return session;
}
