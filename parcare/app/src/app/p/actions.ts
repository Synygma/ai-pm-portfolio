"use server";

import { redirect } from "next/navigation";
import { setParentCookie } from "@/auth/parent";
import { getServiceRepos } from "@/data";
import { appNow } from "@/domain/clock";
import { redeemInvite } from "@/services/parent-session";

/**
 * "Open my ParCare": uses up the one-time link and signs the parent in on this phone (90 days).
 * A form action, so a link preview that only opens the page never uses the link up.
 */
export async function redeemInviteAction(token: string): Promise<void> {
  const repos = getServiceRepos();
  const result = await redeemInvite(repos, token, new Date());
  if (!result.ok) redirect(`/p/${encodeURIComponent(token)}`);
  await setParentCookie(result.token, result.expiresAt);
  const household = await repos.households.get(result.parent.householdId);
  if (household) await repos.parentProfiles.update(result.parent.id, { lastSeenAt: appNow(household).toISOString() });
  redirect("/p");
}
