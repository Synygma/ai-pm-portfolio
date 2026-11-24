import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { openPasswordResetLink } from "@/auth";

// Where the reset link in the email lands (Supabase adds ?code=…, memory mode ?token=…).
// A good link signs the person in for a new password; any other goes to the same page, which
// then says the link has expired.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  await openPasswordResetLink({ code: params.get("code"), token: params.get("token") });
  redirect("/reset-password");
}
