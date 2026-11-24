import { getDataMode } from "@/data";
import { getCurrentChild } from "@/data/access";
import { getCurrentParent } from "@/data/parent-access";
import { FileVoiceStore, isSafeVoicePath } from "@/services/voice";

const TYPES: Record<string, string> = { webm: "audio/webm", ogg: "audio/ogg", m4a: "audio/mp4" };

// Memory mode only: plays a stored voice clip to that household's signed-in child or its parent.
// (With Supabase the app uses short-lived signed URLs from the private bucket instead.)
export async function GET(_request: Request, { params }: { params: Promise<{ household: string; file: string }> }) {
  if (getDataMode() !== "memory") return new Response(null, { status: 404 });
  const { household, file } = await params;
  const storagePath = `${household}/${file}`;
  if (!isSafeVoicePath(storagePath)) return new Response(null, { status: 404 });
  // The household's signed-in child, or the household's parent (her app plays the child's voice reminders).
  const child = await getCurrentChild();
  const allowed = child?.household?.id === household || (await getCurrentParent())?.household.id === household;
  if (!allowed) return new Response(null, { status: 404 });
  const data = new FileVoiceStore().read(storagePath);
  if (!data) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": TYPES[file.split(".").pop() ?? ""] ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}
