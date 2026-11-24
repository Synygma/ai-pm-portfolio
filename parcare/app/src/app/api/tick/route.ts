import { timingSafeEqual } from "node:crypto";
import { getServiceRepos } from "@/data";
import { tickAllHouseholds } from "@/services/checkins";
import { getServiceVoiceStore } from "@/services/voice-store";

// Runs the check-in engine for every household. Production: Supabase pg_cron + pg_net call this
// every minute with "Authorization: Bearer <CRON_SECRET>" (Vercel Hobby cron is daily only).
// Locally the demo clock runs the same engine directly.

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(request: Request) {
  if (!process.env.CRON_SECRET?.trim()) return Response.json({ error: "CRON_SECRET is not set" }, { status: 503 });
  if (!authorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
  const summary = await tickAllHouseholds(getServiceRepos(), Date.now(), getServiceVoiceStore());
  return Response.json({ ok: true, ...summary });
}

export const POST = handle;
export const GET = handle;
