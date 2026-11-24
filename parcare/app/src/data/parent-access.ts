import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { readParentToken } from "@/auth/parent";
import { type Avatar, getAvatar } from "@/config/brand";
import { verifyParentSession } from "@/services/parent-session";
import { getServiceRepos } from "./index";
import type { Repos } from "./repo";
import type { HouseholdRow, ParentProfileRow, ProfileRow } from "./types";

// Data-access layer for the parent app: the only place that turns the parent's session cookie
// into "which household is hers". The parent has no database login (PLAN-PARENT, Access), so this
// uses the server-side repositories and every parent query must start from here and stay inside
// `household.id`.

export type CurrentParent = {
  sessionId: string;
  parent: ParentProfileRow;
  household: HouseholdRow;
  /** The child's profile (for "Gudiya", the child's pet name). */
  child: ProfileRow | null;
  /** What the parent calls herself in the app: her first name. */
  firstName: string;
  /** The child's name as the parent uses it (pet name, else first name). */
  childName: string;
  companion: Avatar | null;
  repos: Repos;
};

export const getCurrentParent = cache(async (): Promise<CurrentParent | null> => {
  await connection();
  const token = await readParentToken();
  if (!token) return null;
  const repos = getServiceRepos();
  const session = await verifyParentSession(repos, token, new Date());
  if (!session) return null;
  const [parent, household] = await Promise.all([repos.parentProfiles.get(session.parentId), repos.households.get(session.householdId)]);
  if (!parent || !household || parent.householdId !== household.id) return null;
  const child = await repos.profiles.get(household.childId);
  return {
    sessionId: session.id,
    parent,
    household,
    child,
    firstName: parent.name.trim().split(/\s+/)[0] ?? parent.name,
    childName: child?.petName || child?.fullName.trim().split(/\s+/)[0] || "",
    companion: household.parentAvatarId ? getAvatar(household.parentAvatarId) : null,
    repos,
  };
});

/** Like getCurrentParent, but sends anyone without a parent session to /parent. */
export async function requireParent(): Promise<CurrentParent> {
  const parent = await getCurrentParent();
  if (!parent) redirect("/parent");
  return parent;
}
