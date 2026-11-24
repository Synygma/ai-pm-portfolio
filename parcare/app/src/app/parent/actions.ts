"use server";

import { redirect } from "next/navigation";
import { tokenFromPasted } from "@/domain/invite";

/** "Paste your link": goes to the usual invite page, which checks the link and offers "Open my ParCare". */
export async function openPastedLinkAction(_prev: { bad: boolean }, formData: FormData): Promise<{ bad: boolean }> {
  const token = tokenFromPasted(String(formData.get("link") ?? "").slice(0, 500));
  if (!token) return { bad: true };
  redirect(`/p/${encodeURIComponent(token)}`);
}
