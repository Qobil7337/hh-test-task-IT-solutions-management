import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getSessionUser, safeReturnPath } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const returnTo = safeReturnPath(
    typeof next === "string" ? next : "",
    "/account",
  );

  // Already signed in: nothing to do here.
  if (await getSessionUser()) redirect(returnTo);

  return (
    <section className="mx-auto max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Sign in to donate and to see your donation history. Administrators
          also get the campaign management area.
        </p>
        <AuthForm redirectTo={returnTo} />
      </div>
    </section>
  );
}
