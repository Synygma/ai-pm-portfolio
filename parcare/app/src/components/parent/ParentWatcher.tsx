"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const POLL_MS = 10_000;

// While her app is open: every few seconds (and when she comes back to it) check for new messages
// from her companion (then refresh, so they show and can be read aloud) and for a ringing
// check-in (then open the ringing page). Push covers the app being in the background.
export function ParentWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const latest = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (pathname.startsWith("/p/setup")) return;
    let stopped = false;
    async function check() {
      try {
        const res = await fetch("/api/parent/poll", { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as { ringing: boolean; reminder: boolean; latest: string | null };
        // The check-in's second reminder first, then the child's voice reminder.
        if (data.ringing && pathname !== "/p/ringing" && pathname !== "/p/pause") {
          router.push("/p/ringing");
          return;
        }
        if (!data.ringing && data.reminder && pathname !== "/p/reminder" && pathname !== "/p/pause") {
          router.push("/p/reminder");
          return;
        }
        if (latest.current !== undefined && data.latest !== latest.current) router.refresh();
        latest.current = data.latest;
      } catch {
        // Offline: try again next time.
      }
    }
    void check();
    const timer = setInterval(check, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && void check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname, router]);

  return null;
}
