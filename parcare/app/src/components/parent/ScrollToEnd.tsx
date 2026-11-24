"use client";

import { useEffect } from "react";

/** Opening a chat shows the newest message, like any chat app. */
export function ScrollToEnd() {
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight });
  }, []);
  return null;
}
