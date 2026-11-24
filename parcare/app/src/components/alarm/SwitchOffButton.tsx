"use client";

import { useFormStatus } from "react-dom";

// The alarm's submit button: says "Switching off…" while the server works, so a tap on a slow
// phone connection clearly did something (P-037).
export function SwitchOffButton({ label, busy, className, testId }: { label: string; busy: string; className: string; testId?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} data-testid={testId}>
      {pending ? busy : label}
    </button>
  );
}
