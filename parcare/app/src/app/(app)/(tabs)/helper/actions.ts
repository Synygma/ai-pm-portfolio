"use server";

import { revalidatePath } from "next/cache";
import { getRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { appNow } from "@/domain/clock";
import { markHelperSeen, setHelperDone } from "@/services/helper";

/** Opening the Helper list marks new requests as Seen. */
export async function markHelperSeenAction(): Promise<void> {
  const child = await getCurrentChild();
  if (!child?.household) return;
  await markHelperSeen(await getRepos(), child.household.id, appNow(child.household));
}

export async function setHelperDoneAction(id: string, done: boolean): Promise<void> {
  const child = await getCurrentChild();
  if (!child?.household) return;
  await setHelperDone(await getRepos(), child.household.id, id, done, appNow(child.household));
  revalidatePath("/helper");
}
