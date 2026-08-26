"use client";

import { useActionState } from "react";
import { donateAction, type ActionState } from "@/app/actions";
import { formatAmount } from "@/lib/format";

const INITIAL: ActionState = {};

export function DonationForm({
  campaignId,
  defaultDonorName,
  remaining,
}: {
  campaignId: string;
  defaultDonorName: string;
  remaining: string;
}) {
  const [state, action, pending] = useActionState(donateAction, INITIAL);

  return (
    <form action={action} className="mt-4 space-y-4">
      <input type="hidden" name="campaignId" value={campaignId} />

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Amount (USD)</span>
        <input
          name="amount"
          type="text"
          inputMode="decimal"
          required
          pattern="^\d{1,10}(\.\d{1,2})?$"
          placeholder="50.00"
          title="A positive amount with at most two decimals"
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 focus:border-zinc-900 focus:outline-none"
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Up to {formatAmount(remaining)} remaining.
        </span>
      </label>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Display name</span>
        <input
          name="donorName"
          type="text"
          required
          maxLength={200}
          defaultValue={defaultDonorName}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 focus:border-zinc-900 focus:outline-none"
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Donate"}
      </button>
    </form>
  );
}
