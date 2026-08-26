import { cookies } from "next/headers";

// The JWT lives in an httpOnly cookie, set and read only on the server.
export const TOKEN_COOKIE = "charityhub_token";

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}
