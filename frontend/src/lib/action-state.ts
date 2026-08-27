// Shared helpers for Server Actions driven by `useActionState`.
import { GraphQLRequestError } from "./graphql";

export interface ActionState {
  error?: string;
  success?: string;
}

export function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function toErrorState(error: unknown): ActionState {
  if (error instanceof GraphQLRequestError) return { error: error.message };
  return { error: "The CharityHub API is unavailable. Please try again." };
}
