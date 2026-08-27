"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { field, toErrorState, type ActionState } from "@/lib/action-state";
import { createDonation, login, register } from "@/lib/api";
import { getToken, TOKEN_COOKIE } from "@/lib/auth";
import { safeReturnPath } from "@/lib/session";

const TOKEN_MAX_AGE_SECONDS = 60 * 60; // matches the backend's JWT_EXPIRES_IN

async function storeToken(token: string): Promise<void> {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
}

/**
 * Sign-in / sign-out forms may carry a hidden `redirectTo` field naming the
 * page to open afterwards. Without it the current page simply re-renders with
 * the new session (the sign-in box on a campaign page works that way).
 * `redirect` throws, so this runs outside the try/catch around the API call.
 */
function finishSessionChange(formData: FormData): ActionState {
  revalidatePath("/", "layout");
  const target = field(formData, "redirectTo");
  if (target) redirect(safeReturnPath(target, "/"));
  return {};
}

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { accessToken } = await login(
      field(formData, "email"),
      field(formData, "password"),
    );
    await storeToken(accessToken);
  } catch (error) {
    return toErrorState(error);
  }
  return finishSessionChange(formData);
}

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { accessToken } = await register(
      field(formData, "name"),
      field(formData, "email"),
      field(formData, "password"),
    );
    await storeToken(accessToken);
  } catch (error) {
    return toErrorState(error);
  }
  return finishSessionChange(formData);
}

export async function logoutAction(formData: FormData): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
  finishSessionChange(formData);
}

export async function donateAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getToken();
  if (!token) {
    return { error: "Please sign in to donate." };
  }

  const campaignId = field(formData, "campaignId");
  try {
    const donation = await createDonation(token, {
      campaignId,
      amount: field(formData, "amount"),
      donorName: field(formData, "donorName"),
    });
    revalidatePath("/campaigns");
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath("/account");
    revalidatePath("/admin", "layout");
    return { success: `Thank you! Your donation of $${donation.amount} was recorded.` };
  } catch (error) {
    return toErrorState(error);
  }
}
