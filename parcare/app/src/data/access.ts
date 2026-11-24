import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getSessionUser } from "@/auth";
import { TERMS_VERSION } from "@/config/terms";
import { getRepos } from "./index";
import type { HouseholdRow, ParentProfileRow, ProfileRow } from "./types";

// Data-access layer: the only place that turns the session into "who is this child and which
// household is theirs". Every household query must start from here (the memory adapter has no
// row-level security of its own).

export type CurrentChild = {
  userId: string;
  email: string;
  profile: ProfileRow | null;
  household: HouseholdRow | null;
  parent: ParentProfileRow | null;
  /** Agreed to the current "can and cannot do" + terms (needed once before using the app). */
  agreedTerms: boolean;
};

/** The signed-in child, or null. Cached for the duration of one request. */
export const getCurrentChild = cache(async (): Promise<CurrentChild | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const repos = await getRepos();
  const [profile, household, agreements] = await Promise.all([
    repos.profiles.get(user.id),
    repos.households.findOne({ childId: user.id }),
    repos.termsAgreements.find({ userId: user.id, termsVersion: TERMS_VERSION }),
  ]);
  const parent = household?.managedParentId ? await repos.parentProfiles.get(household.managedParentId) : null;
  return {
    userId: user.id,
    email: user.email,
    profile,
    household,
    parent: parent && parent.householdId === household?.id ? parent : null,
    agreedTerms: agreements.length > 0,
  };
});

/**
 * Like getCurrentChild, but sends signed-out visitors to the login page, and anyone who has not
 * yet agreed to "what ParCare can and cannot do" + terms to the agreement page first.
 */
export async function requireChild(): Promise<CurrentChild> {
  const child = await getCurrentChild();
  if (!child) redirect("/login");
  if (!child.agreedTerms) redirect("/agree");
  return child;
}
