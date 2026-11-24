import { Suspense } from "react";
import { AlarmWatcher } from "@/components/alarm/AlarmWatcher";

// All signed-in screens: watch for alarms while the app is open.
export default function SignedInLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Reads the URL: inside Suspense so pages with dynamic segments can still prerender. */}
      <Suspense fallback={null}>
        <AlarmWatcher />
      </Suspense>
    </>
  );
}
