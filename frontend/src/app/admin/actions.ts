"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { field, toErrorState, type ActionState } from "@/lib/action-state";
import {
  closeCampaign,
  createCampaign,
  deleteCampaign,
  updateCampaign,
} from "@/lib/api";
import { getToken } from "@/lib/auth";
import { safeReturnPath } from "@/lib/session";
import type { CampaignInput } from "@/lib/types";

// Campaign management. The API enforces the ADMIN role on every mutation;
// these actions only forward the session token and translate errors for the
// forms, so a non-admin token simply receives the API's "Forbidden" message.

const SIGN_IN_REQUIRED: ActionState = {
  error: "Please sign in as an administrator.",
};

function campaignInput(formData: FormData): CampaignInput {
  return {
    title: field(formData, "title"),
    description: field(formData, "description"),
    targetAmount: field(formData, "targetAmount"),
  };
}

// Campaign data appears on the public pages, the account page and the admin area.
function revalidateCampaignPages(id: string): void {
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/account");
  revalidatePath("/admin", "layout");
}

export async function createCampaignAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getToken();
  if (!token) return SIGN_IN_REQUIRED;

  let id: string;
  try {
    ({ id } = await createCampaign(token, campaignInput(formData)));
  } catch (error) {
    return toErrorState(error);
  }
  revalidateCampaignPages(id);
  redirect(`/admin/campaigns/${id}?created=1`);
}

export async function updateCampaignAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getToken();
  if (!token) return SIGN_IN_REQUIRED;

  const id = field(formData, "id");
  try {
    await updateCampaign(token, id, campaignInput(formData));
  } catch (error) {
    return toErrorState(error);
  }
  revalidateCampaignPages(id);
  return { success: "Campaign updated." };
}

export async function closeCampaignAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getToken();
  if (!token) return SIGN_IN_REQUIRED;

  const id = field(formData, "id");
  try {
    await closeCampaign(token, id);
  } catch (error) {
    return toErrorState(error);
  }
  revalidateCampaignPages(id);
  return { success: "Campaign closed. It no longer accepts donations." };
}

export async function deleteCampaignAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getToken();
  if (!token) return SIGN_IN_REQUIRED;

  const id = field(formData, "id");
  const redirectTo = field(formData, "redirectTo");
  try {
    await deleteCampaign(token, id);
  } catch (error) {
    return toErrorState(error);
  }
  revalidateCampaignPages(id);
  if (redirectTo) redirect(safeReturnPath(redirectTo, "/admin"));
  return { success: "Campaign deleted." };
}
