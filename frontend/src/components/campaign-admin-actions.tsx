"use client";

import { useActionState, type FormEvent } from "react";
import {
  closeCampaignAction,
  deleteCampaignAction,
} from "@/app/admin/actions";
import type { ActionState } from "@/lib/action-state";
import type { Campaign } from "@/lib/types";

const INITIAL: ActionState = {};

const buttonClass =
  "rounded-md border px-3 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50";

function confirmSubmit(message: string) {
  return (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(message)) event.preventDefault();
  };
}

/** Close / delete buttons for one campaign (dashboard rows and the admin campaign page). */
export function CampaignAdminActions({
  campaign,
  donationCount,
  redirectAfterDelete,
}: {
  campaign: Campaign;
  /** When known, deletion is disabled up front for campaigns with donations. */
  donationCount?: number;
  /** Page to open after a successful deletion; omit to stay on the current page. */
  redirectAfterDelete?: string;
}) {
  const [closeState, close, closing] = useActionState(
    closeCampaignAction,
    INITIAL,
  );
  const [deleteState, remove, deleting] = useActionState(
    deleteCampaignAction,
    INITIAL,
  );

  // Mirrors the API rules so the buttons explain themselves; the API still
  // has the final say and its error is shown below when a call is rejected.
  const canClose = campaign.status === "ACTIVE";
  const canDelete = !donationCount;
  const error = deleteState.error ?? closeState.error;
  const success = deleteState.success ?? closeState.success;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <form
          action={close}
          onSubmit={confirmSubmit(
            `Close "${campaign.title}"? It will stop accepting donations and cannot be reopened.`,
          )}
        >
          <input type="hidden" name="id" value={campaign.id} />
          <button
            type="submit"
            disabled={!canClose || closing}
            title={
              canClose
                ? "Stop accepting donations"
                : "Only active campaigns can be closed"
            }
            className={`${buttonClass} border-zinc-300 text-zinc-700 hover:bg-zinc-50`}
          >
            {closing ? "Closing…" : "Close"}
          </button>
        </form>

        <form
          action={remove}
          onSubmit={confirmSubmit(
            `Delete "${campaign.title}" permanently? This cannot be undone.`,
          )}
        >
          <input type="hidden" name="id" value={campaign.id} />
          {redirectAfterDelete && (
            <input type="hidden" name="redirectTo" value={redirectAfterDelete} />
          )}
          <button
            type="submit"
            disabled={!canDelete || deleting}
            title={
              canDelete
                ? "Delete this campaign"
                : "Campaigns with donations cannot be deleted"
            }
            className={`${buttonClass} border-red-200 text-red-700 hover:bg-red-50`}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </form>
      </div>

      {error && (
        <p role="alert" className="mt-2 max-w-xs text-xs text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-2 max-w-xs text-xs text-emerald-700">
          {success}
        </p>
      )}
    </div>
  );
}
