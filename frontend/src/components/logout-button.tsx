import { logoutAction } from "@/app/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="text-xs text-zinc-500 underline underline-offset-2 hover:text-zinc-900"
      >
        Sign out
      </button>
    </form>
  );
}
