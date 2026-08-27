import { logoutAction } from "@/app/actions";

export function LogoutButton({
  redirectTo,
  className = "text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900",
}: {
  /** Page to open after signing out; omit to stay on the current page. */
  redirectTo?: string;
  className?: string;
}) {
  return (
    <form action={logoutAction}>
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}
