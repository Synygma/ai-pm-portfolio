import { Suspense } from "react";
import { BottomTabs, TabsNav } from "@/components/wa/BottomTabs";
import { TopBar } from "@/components/wa/TopBar";
import { brand } from "@/config/brand";

// Signed-in screens with the green top bar and the five bottom tabs. Static shell: each page
// reads the session behind its own <Suspense>, so this frame shows instantly.
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title={brand.appName} />
      <main className="flex flex-1 flex-col">{children}</main>
      <Suspense fallback={<TabsNav pathname="" />}>
        <BottomTabs />
      </Suspense>
    </div>
  );
}
