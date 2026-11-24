"use client";

import { useEffect } from "react";
import { markHelperSeenAction } from "@/app/(app)/(tabs)/helper/actions";

// Opening the Helper list marks new requests as Seen (the "New" labels stay until the next visit).
export function MarkHelperSeen({ count }: { count: number }) {
  useEffect(() => {
    if (count > 0) void markHelperSeenAction();
  }, [count]);
  return null;
}
