import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/wa/ListSkeleton";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { PinIcon, RemindersIcon } from "@/components/wa/icons";
import { brand } from "@/config/brand";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { activeConsents } from "@/domain/engine";
import { loadCompanionChat, timeFormatter } from "@/data/chat-data";
import { bubbleLines, dayLabel, unreadCount } from "@/domain/chat";
import { replyLine } from "@/domain/replies";
import { formatDayLabel } from "@/i18n/format";

// Chats tab (5.3): chat list with the parent's companion chat pinned at the top.
export default function ChatsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <ChatList />
    </Suspense>
  );
}

async function ChatList() {
  const t = await getTranslations("chatList");
  const tb = await getTranslations("bubbles");
  const tr = await getTranslations("replies");
  const child = await requireChild();
  const chat = await loadCompanionChat(child);

  // Not set up yet: the wizard resumes where the child left off.
  if (!chat || !child.household?.setupCompletedAt) redirect("/setup");

  const last = chat.messages.at(-1);
  const formatTime = timeFormatter(chat.timeZone);
  const preview = last
    ? bubbleLines(last, {
        ...chat,
        companionName: chat.companion?.name ?? null,
        formatTime,
      })[0]
    : null;
  // A reaction or voice reply from the parent (P-030) has its own wording.
  const reply = last?.kind === "reply" ? replyLine(last, { childName: chat.childPetName, parentName: chat.parentPetName }) : null;
  const unread = unreadCount(chat.messages, chat.now);
  let when = "";
  if (last) {
    const label = dayLabel(last.createdAt, chat.now, chat.timeZone);
    when = label.kind === "today" ? formatTime(last.createdAt) : await formatDayLabel(label, "short");
  }
  const name = chat.companion?.name ?? t("companionFallback");

  // N7 / G1: tell the child plainly when nothing is being checked.
  const consents = await (await getRepos()).consents.find({ householdId: child.household.id });
  const noneActive = activeConsents(consents, chat.now).length === 0;
  const banner = !noneActive
    ? null
    : consents.length > 0
      ? tb("allDisabled", { petName: chat.parentPetName })
      : t("noConsents", { parentPetName: chat.parentPetName });

  return (
    <>
      {banner && (
        <div role="status" className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-3 text-base text-amber-900" data-testid="consent-banner">
          <span>{banner}</span>
          <Link href="/settings" className="shrink-0 font-medium underline">
            {t("seeCheckins")}
          </Link>
        </div>
      )}
      <ul className="divide-y divide-[#e9edef]">
        <li>
          <Link href="/chat" className="flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6]" data-testid="companion-chat-row">
            <AvatarCircle src={chat.companion?.image ?? brand.icons.icon192} alt="" size={52} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[17px] font-medium text-[#111b21]">{name}</span>
                <span className={`shrink-0 text-xs ${unread ? "font-semibold text-[#008069]" : "text-[#54656f]"}`}>{when}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="flex-1 truncate text-[15px] text-[#54656f]">{reply ? tr(reply.key, reply.values) : preview ? tb(preview.key, preview.values) : t("noMessages")}</span>
                <span className="sr-only">{t("pinned")}</span>
                <PinIcon size={16} className="shrink-0 text-[#8696a0]" />
                {unread > 0 && (
                  <span
                    className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#008069] px-1.5 text-xs font-semibold text-white"
                    aria-label={t("unread", { count: unread })}
                    data-testid="unread-badge"
                  >
                    {unread}
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
        <li>
          <Link href="/alerts" className="flex min-h-14 items-center gap-3 px-4 py-3 text-[#54656f] hover:bg-[#f5f6f6]" data-testid="alert-history-row">
            <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#f0f2f5]">
              <RemindersIcon size={24} />
            </span>
            <span className="text-[17px] text-[#111b21]">{t("alertHistory")}</span>
          </Link>
        </li>
      </ul>
    </>
  );
}
