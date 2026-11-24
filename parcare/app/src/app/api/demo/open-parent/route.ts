import { type NextRequest, NextResponse } from "next/server";
import { PARENT_COOKIE } from "@/auth/parent";
import { isDemoMode } from "@/config/env";
import { getServiceRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { createParentSession } from "@/services/parent-session";

// Demo only (PLAN-PARENT decision 4): the signed-in child opens their parent's app in this same
// browser, without an invite link, so both apps can be shown side by side.
export async function GET(request: NextRequest) {
  if (!isDemoMode()) return new NextResponse("Not found", { status: 404 });
  const child = await getCurrentChild();
  const household = child?.household;
  if (!household?.managedParentId) return NextResponse.redirect(new URL("/login", request.url));
  const repos = getServiceRepos();
  const { token, expiresAt } = await createParentSession(repos, household.id, household.managedParentId, new Date());
  const res = NextResponse.redirect(new URL("/p", request.url));
  res.cookies.set(PARENT_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
  return res;
}
