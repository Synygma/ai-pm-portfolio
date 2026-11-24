"use client";

import { useEffect } from "react";
import { markChatReadAction } from "./actions";

// Opening the chat jumps to the newest message (like any chat app) and marks the messages as
// read (clears the unread badge in the chat list).
export function MarkChatRead({ unread }: { unread: number }) {
  useEffect(() => {
    window.scrollTo({ top: document.documentElement.scrollHeight });
  }, []);
  useEffect(() => {
    if (unread > 0) void markChatReadAction();
  }, [unread]);
  return null;
}
