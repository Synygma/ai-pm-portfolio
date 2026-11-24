"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChatsIcon, DigestIcon, HelperIcon, RemindersIcon, SettingsIcon } from "./icons";

const TABS = [
  { href: "/home", key: "chats", Icon: ChatsIcon },
  { href: "/digest", key: "digest", Icon: DigestIcon },
  { href: "/helper", key: "helper", Icon: HelperIcon },
  { href: "/reminders", key: "reminders", Icon: RemindersIcon },
  { href: "/settings", key: "settings", Icon: SettingsIcon },
] as const;

// Bottom navigation: Chats · Digest · Helper · Reminders · Settings (5.3).
// Reads the URL, so layouts render it inside <Suspense> with <TabsNav pathname="" /> as fallback.
export function BottomTabs() {
  return <TabsNav pathname={usePathname()} />;
}

export function TabsNav({ pathname }: { pathname: string }) {
  const t = useTranslations("shell");
  return (
    <nav
      aria-label={t("tabsLabel")}
      className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-[#e9edef] bg-white pb-[env(safe-area-inset-bottom)]"
    >
      {TABS.map(({ href, key, Icon }) => {
        const active = pathname !== "" && (pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className="flex min-h-16 flex-col items-center justify-center gap-0.5 text-[#54656f]"
          >
            <span className={`flex h-8 w-14 items-center justify-center rounded-full ${active ? "bg-[#d8fdd2] text-[#008069]" : ""}`}>
              <Icon size={22} />
            </span>
            <span className={`text-xs ${active ? "font-semibold text-[#111b21]" : ""}`}>{t(`tabs.${key}`)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
