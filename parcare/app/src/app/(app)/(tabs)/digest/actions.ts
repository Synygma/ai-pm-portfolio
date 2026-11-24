"use server";

import { revalidatePath } from "next/cache";
import { getRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { appNow } from "@/domain/clock";
import { setDigestFeedback } from "@/services/digest";

/** Stores "Matched what my parent told me" / "Did not match" / "Skip" for one digest. */
export async function digestFeedbackAction(digestId: string, verdict: "matched" | "not_matched" | "skipped"): Promise<{ ok: boolean }> {
  const child = await getCurrentChild();
  if (!child?.household) return { ok: false };
  const saved = await setDigestFeedback(await getRepos(), child.household.id, digestId, verdict, appNow(child.household));
  revalidatePath("/digest");
  return { ok: saved !== null };
}
