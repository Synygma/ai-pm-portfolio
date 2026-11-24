import "server-only";
import { cookies } from "next/headers";

// The parent's session cookie: separate from the child's login, so both can be signed in in one
// browser (PLAN-PARENT decision 4).
export const PARENT_COOKIE = "parcare_parent";

export async function readParentToken(): Promise<string | null> {
  return (await cookies()).get(PARENT_COOKIE)?.value ?? null;
}

export async function setParentCookie(token: string, expires: Date): Promise<void> {
  (await cookies()).set(PARENT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function clearParentCookie(): Promise<void> {
  (await cookies()).delete(PARENT_COOKIE);
}
