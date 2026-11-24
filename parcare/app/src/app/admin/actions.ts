"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { deleteLogin, listLogins } from "@/auth";
import { adminSignIn, adminSignOut, isAdminSignedIn } from "@/auth/admin";
import { getServiceRepos } from "@/data";
import { NOTE_PRESETS, type NotePreset, type NoteProblem } from "@/domain/admin";
import { deleteUserCompletely, sendGentleNote } from "@/services/admin";
import { getServiceVoiceStore } from "@/services/voice-store";

export type AdminLoginState = { error?: "wrong" | "tooMany" | "off" };

export async function adminLoginAction(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const result = await adminSignIn(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (result !== "ok") return { error: result };
  redirect("/admin");
}

export async function adminLogoutAction(): Promise<void> {
  await adminSignOut();
  redirect("/admin/login");
}

/** Deletes a user completely (needs the confirmation tick). The sample family is refused. */
export async function deleteUserAction(userId: string, formData: FormData): Promise<void> {
  if (!(await isAdminSignedIn())) redirect("/admin/login");
  if (formData.get("confirm") !== "on") return;
  const login = (await listLogins()).find((l) => l.id === userId);
  const r = await deleteUserCompletely(getServiceRepos(), getServiceVoiceStore(), login, deleteLogin);
  revalidatePath("/admin");
  redirect(r.ok ? "/admin?deleted=1" : "/admin?deleteFailed=1");
}

export type SendNoteState = {
  sent?: { families: number; skipped: number; pushed: number };
  error?: NoteProblem | "confirm" | "failed";
};

export async function sendNoteAction(_prev: SendNoteState, formData: FormData): Promise<SendNoteState> {
  if (!(await isAdminSignedIn())) redirect("/admin/login");
  const t = await getTranslations("admin.note");
  const choice = String(formData.get("choice") ?? "");
  let text: string;
  let preset: NotePreset | null = null;
  if ((NOTE_PRESETS as readonly string[]).includes(choice)) {
    preset = choice as NotePreset;
    text = t(`presets.${preset}`);
  } else if (choice === "custom") {
    if (formData.get("gentle") !== "on") return { error: "confirm" };
    text = String(formData.get("custom") ?? "");
  } else {
    return { error: "empty" };
  }
  const r = await sendGentleNote(getServiceRepos(), { text, preset, pushTitle: t("pushTitle") }, new Date()).catch((e: unknown) => {
    console.error("admin note failed", e instanceof Error ? e.message : e);
    return null;
  });
  if (!r) return { error: "failed" };
  if (!r.ok) return { error: r.reason };
  revalidatePath("/admin");
  return { sent: { families: r.families, skipped: r.skipped, pushed: r.pushed } };
}
