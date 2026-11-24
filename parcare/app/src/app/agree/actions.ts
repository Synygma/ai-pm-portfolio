"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { clientIp, recordAgreement } from "@/services/agreement";

export type AgreeState = { error?: boolean };

/** "I understand…" ticked: store the record (kept forever) and go on into the app. */
export async function agreeAction(_prev: AgreeState, formData: FormData): Promise<AgreeState> {
  if (formData.get("accept") !== "on") return { error: true };
  const child = await getCurrentChild();
  if (!child) redirect("/login");
  await recordAgreement(await getRepos(), child.userId, clientIp(await headers()), new Date());
  redirect(child.household?.setupCompletedAt ? "/home" : "/setup");
}
