// ============================================================
//  USAGE LIMIT: max 5 stories + poems together per person per hour (no login).
//  Shared by stories and poems, because both use the same free AI limit.
//  A "person" = their internet address (IP address).
//  We only remember the address and the times of requests, in memory.
//  Nothing is saved to a file or database; restarting the server clears it.
// ============================================================

export const MAX_STORIES = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

const visits = new Map(); // address -> list of times (in milliseconds)

// Returns true if this person may make another story now (and counts it).
export function allowStory(address, now = Date.now()) {
  const recent = (visits.get(address) || []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_STORIES) {
    visits.set(address, recent);
    return false;
  }

  recent.push(now);
  visits.set(address, recent);
  cleanUp(now);
  return true;
}

// Forget people who haven't visited in the last hour, so memory stays small.
function cleanUp(now) {
  if (visits.size < 1000) return;
  for (const [address, times] of visits) {
    if (times.every((t) => now - t >= WINDOW_MS)) visits.delete(address);
  }
}

// Find the visitor's address. When the website is online, the hosting service
// (for example Vercel) fills in these headers.
export function getAddress(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}
