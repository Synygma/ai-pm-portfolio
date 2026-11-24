"use client";

import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui/Screen";

/** Back to wherever the page was opened from; the start screen if it was opened directly. */
export function BackButton({ label }: { label: string }) {
  const router = useRouter();
  return (
    <button type="button" className={`${buttonStyles.secondary} mt-4`} onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}>
      {label}
    </button>
  );
}
