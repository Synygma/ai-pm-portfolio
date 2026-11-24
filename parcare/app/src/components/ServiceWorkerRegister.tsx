"use client";

import { useEffect } from "react";

// Registers public/sw.js (Web Push + installable PWA). Silent if the browser has no support.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
  }, []);
  return null;
}
