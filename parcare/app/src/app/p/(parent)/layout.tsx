import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ParentWatcher } from "@/components/parent/ParentWatcher";
import { CompanionVoice } from "@/components/parent/ReadAloud";
import { getCurrentParent } from "@/data/parent-access";
import { ChatsIcon, HelperIcon, SettingsIcon, SosIcon } from "@/components/wa/icons";

// The parent's app: large text and big buttons; SOS, Ask for help and Settings always visible
// (handoff N9 / G6: SOS never calls anyone).
export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("parentApp.bar");
  const item = "flex min-h-16 flex-1 flex-col items-center justify-center gap-0.5 text-base font-semibold";
  return (
    <div className="flex min-h-dvh flex-col text-[18px]" data-testid="parent-app">
      <main className="flex flex-1 flex-col">{children}</main>
      {/* Reads the URL: inside Suspense so pages can still prerender. */}
      <Suspense fallback={null}>
        <ParentWatcher />
        <VoiceOfCompanion />
      </Suspense>
      <nav aria-label={t("label")} className="sticky bottom-0 z-10 flex border-t border-[#e9edef] bg-white pb-[env(safe-area-inset-bottom)]">
        <Link href="/p" className={`${item} text-[#008069]`}>
          <ChatsIcon size={26} />
          {t("chat")}
        </Link>
        <Link href="/p/help" className={`${item} text-[#008069]`}>
          <HelperIcon size={26} />
          {t("help")}
        </Link>
        <Link href="/p/settings" className={`${item} text-[#008069]`}>
          <SettingsIcon size={26} />
          {t("settings")}
        </Link>
        <Link href="/p/sos" className={`${item} bg-[#b42318] text-white`} data-testid="sos-button">
          <SosIcon size={26} />
          {t("sos")}
        </Link>
      </nav>
    </div>
  );
}

/** Reading aloud uses a male or female voice to match her companion (P-028). */
async function VoiceOfCompanion() {
  const me = await getCurrentParent();
  return me?.companion ? <CompanionVoice voice={me.companion.voice} /> : null;
}

