"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRepos } from "@/data";
import { getCurrentChild } from "@/data/access";
import { appNow } from "@/domain/clock";
import type { ReminderErrors } from "@/domain/reminders";
import { createReminder, deleteReminder } from "@/services/reminders";
import { getVoiceStore } from "@/services/voice-store";

export type CreateReminderState = { errors?: ReminderErrors; failed?: boolean };

/** Saves a new voice reminder (FormData: label, date, time, repeat, optional audio file). */
export async function createReminderAction(formData: FormData): Promise<CreateReminderState> {
  const child = await getCurrentChild();
  if (!child?.household || !child.parent) return { failed: true };
  const audioFile = formData.get("audio");
  const audio =
    audioFile instanceof File && audioFile.size > 0 ? { data: new Uint8Array(await audioFile.arrayBuffer()), type: audioFile.type || "audio/webm" } : null;
  const result = await createReminder(
    await getRepos(),
    await getVoiceStore(),
    child.household,
    child.parent.timeZone,
    {
      label: String(formData.get("label") ?? ""),
      date: String(formData.get("date") ?? ""),
      time: String(formData.get("time") ?? ""),
      repeat: String(formData.get("repeat") ?? "none"),
      audio,
    },
    appNow(child.household),
  );
  if (!result.ok) return { errors: result.errors };
  revalidatePath("/reminders");
  redirect("/reminders");
}

export async function deleteReminderAction(id: string): Promise<void> {
  const child = await getCurrentChild();
  if (!child?.household) return;
  await deleteReminder(await getRepos(), await getVoiceStore(), child.household.id, id);
  revalidatePath("/reminders");
}
