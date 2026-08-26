"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createDonation, login, register } from "@/lib/api";
import { getToken, TOKEN_COOKIE } from "@/lib/auth";
import { GraphQLRequestError } from "@/lib/graphql";

export interface ActionState {
  error?: string;
  success?: string;
}

const TOKEN_MAX_AGE_SECONDS = 60 * 60; // matches the backend's JWT_EXPIRES_IN

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function toErrorState(error: unknown): ActionState {
  if (error instanceof GraphQLRequestError) return { error: error.message };
  return { error: "The CharityHub API is unavailable. Please try again." };
}

async function storeToken(token: string): Promise<void> {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE_SECONDS,
  });
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
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    return toErrorState(error);
  }
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
    revalidatePath("/", "layout");
    return {};
  } catch (error) {
    return toErrorState(error);
  }
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(TOKEN_COOKIE);
  revalidatePath("/", "layout");
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
    return { success: `Thank you! Your donation of $${donation.amount} was recorded.` };
  } catch (error) {
    return toErrorState(error);
  }
}
