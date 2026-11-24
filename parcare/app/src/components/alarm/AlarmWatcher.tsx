"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const POLL_MS = 10_000;

// While the app is open, checks every few seconds (and when the tab comes back) whether an alarm
// is ringing, and opens the full-screen alarm page. Web Push covers the app being in the
// background; a browser app cannot ring when fully closed (CLAUDE.md section 10).
export function AlarmWatcher() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/alarm" || pathname.startsWith("/setup")) return;
    let stopped = false;
    async function check() {
      try {
        const res = await fetch("/api/alarm", { cache: "no-store" });
        if (!res.ok) return;
        const { active } = (await res.json()) as { active: { id: string }[] };
        if (!stopped && active.length > 0) router.push("/alarm");
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
