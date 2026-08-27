"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";

const INITIAL: ActionState = {};

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 focus:border-zinc-900 focus:outline-none";

// Development credentials created by the backend seed (see the README).
const DEMO_ACCOUNTS = [
  { role: "User", email: "user@charityhub.dev", password: "User1234!" },
  { role: "Admin", email: "admin@charityhub.dev", password: "Admin123!" },
];

export function AuthForm({
  redirectTo,
}: {
  /** Page to open after a successful sign-in; omit to stay on the current page. */
  redirectTo?: string;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, login, loginPending] = useActionState(
    loginAction,
    INITIAL,
  );
  const [registerState, register, registerPending] = useActionState(
    registerAction,
    INITIAL,
  );

  const isLogin = mode === "login";
  const state = isLogin ? loginState : registerState;
  const pending = isLogin ? loginPending : registerPending;

  return (
    <div className="mt-4">
      <div className="flex rounded-md border border-zinc-200 p-1 text-sm">
        {(["login", "register"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            className={`flex-1 rounded px-3 py-1.5 font-medium ${
              mode === option
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {option === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form action={isLogin ? login : register} className="mt-4 space-y-4">
        {redirectTo && (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        )}
        {!isLogin && (
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Name</span>
            <input name="name" type="text" required maxLength={100} className={inputClass} />
          </label>
        )}
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Email</span>
          <input name="email" type="email" required className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            className={inputClass}
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
        >
          {pending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="mt-4 text-xs text-zinc-500">
        <p>Demo accounts (seeded database):</p>
        <ul className="mt-1 space-y-1">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email}>
              {account.role}:{" "}
              <code className="rounded bg-zinc-100 px-1">{account.email}</code> /{" "}
              <code className="rounded bg-zinc-100 px-1">{account.password}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
