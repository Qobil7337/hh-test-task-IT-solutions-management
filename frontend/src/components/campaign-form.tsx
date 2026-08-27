"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import type { Campaign } from "@/lib/types";

const INITIAL: ActionState = {};

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 focus:border-zinc-900 focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-500";

type CampaignAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

/** Create / edit form for the campaign fields an administrator may set. */
export function CampaignForm({
  action,
  campaign,
  submitLabel,
  disabled = false,
}: {
  action: CampaignAction;
  /** Existing campaign to edit; omit to create a new one. */
  campaign?: Campaign;
  submitLabel: string;
  /** Completed and closed campaigns cannot be modified (API rule). */
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL);
  const locked = disabled || pending;

  return (
    <form action={formAction} className="space-y-5">
      {campaign && <input type="hidden" name="id" value={campaign.id} />}

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Title</span>
        <input
          name="title"
          type="text"
          required
          maxLength={200}
          defaultValue={campaign?.title}
          disabled={locked}
          className={inputClass}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Description</span>
        <textarea
          name="description"
          required
          maxLength={5000}
          rows={6}
          defaultValue={campaign?.description}
          disabled={locked}
          className={inputClass}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-zinc-700">Target amount (USD)</span>
        <input
          name="targetAmount"
          type="text"
          inputMode="decimal"
          required
          pattern="^\d{1,10}(\.\d{1,2})?$"
          placeholder="10000.00"
          title="A positive amount with at most two decimals"
          defaultValue={campaign?.targetAmount}
          disabled={locked}
          className={inputClass}
        />
        <span className="mt-1 block text-xs text-zinc-500">
          Greater than zero, at most two decimals. The collected amount and the
          status are managed by the API.
        </span>
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
        disabled={locked}
        className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
