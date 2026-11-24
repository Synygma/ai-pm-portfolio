// Web Push (free, VAPID keys from env). Without keys push is simply off; the in-app alarm page
// still works while the app is open.

import webpush from "web-push";
import type { Repos } from "@/data/repo";
import type { Audience } from "@/data/types";

/** `alarm`: the service worker vibrates longer (the second reminder, alarms). */
export type PushPayload = { title: string; body: string; url: string; tag: string; alarm?: boolean };

export function pushKeys(): { publicKey: string; privateKey: string; subject: string } | null {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject: process.env.VAPID_SUBJECT?.trim() || "mailto:team@example.com" };
}

/**
 * Sends to the household's subscriptions on one side: the child's phone (default; older rows have
 * no audience) or the parent's. Dead subscriptions (404/410) are removed.
 */
export async function sendPushToHousehold(repos: Repos, householdId: string, payload: PushPayload, audience: Audience = "child"): Promise<number> {
  const keys = pushKeys();
  if (!keys) return 0;
  webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
  const subs = (await repos.pushSubscriptions.find({ householdId })).filter((s) => (s.audience ?? "child") === audience);
  let sent = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), {
        TTL: 60 * 60,
        urgency: "high",
      });
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await repos.pushSubscriptions.remove(s.id);
      else console.warn(`Push failed (${status ?? "network"})`);
    }
  }
  return sent;
}
