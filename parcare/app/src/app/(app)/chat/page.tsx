import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Fragment, Suspense } from "react";
import { DeleteMessage } from "@/components/parent/DeleteMessage";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { ReplyBar } from "@/components/wa/ReplyBar";
import { VoiceNoteBubble } from "@/components/wa/VoiceNoteBubble";
import { Bubble, DaySeparator } from "@/components/wa/Bubble";
import { BackIcon } from "@/components/wa/icons";
import { brand } from "@/config/brand";
import { requireChild } from "@/data/access";
import { loadCompanionChat, timeFormatter } from "@/data/chat-data";
import { bubbleLines, dayLabel, unreadCount } from "@/domain/chat";
import { isMyVoiceReply, myReaction, replyAbout, replyLine } from "@/domain/replies";
import { getServiceVoiceStore } from "@/services/voice-store";
import { formatDayLabel } from "@/i18n/format";
import { deleteChildMessageAction, markReviewDoneAction, reactChildAction, voiceReplyChildAction } from "./actions";
import { MarkChatRead } from "./MarkChatRead";

// The parent's companion chat (5.3): setup messages, daily digests, alerts and review prompts
// as bubbles. Only the companion writes here. Each bubble has "Delete for me" (P-030).
export default async function ChatPage() {
  const tc = await getTranslations("chat");
  return (
    <div className="flex min-h-dvh flex-col bg-[#EFEAE2]">
      <Suspense
        fallback={
          <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 bg-[#008069] px-2 text-white">
            <Link href="/home" aria-label={tc("back")} className="flex h-12 w-12 items-center justify-center rounded-full">
              <BackIcon />
            </Link>
          </header>
        }
      >
        <Chat />
      </Suspense>
    </div>
  );
}

async function Chat() {
  const t = await getTranslations("chat");
  const tb = await getTranslations("bubbles");
  const tl = await getTranslations("chatList");
  const tr = await getTranslations("replies");
  const child = await requireChild();
  const chat = await loadCompanionChat(child);

  const name = chat?.companion?.name ?? tl("companionFallback");
  const subtitle = chat?.parentPetName ? t("subtitle", { parentPetName: chat.parentPetName }) : t("subtitleNoParent");
  const formatTime = timeFormatter(chat?.timeZone ?? "UTC");
  const ctx = chat ? { ...chat, companionName: chat.companion?.name ?? null, formatTime } : null;

  // Bubbles grouped under day separators; the first bubble of each run gets a tail.
  const rows: { separator?: string; key: string; node: React.ReactNode }[] = [];
  // Voice replies between parent and child (P-030): a short-lived link to each clip.
  const voice = getServiceVoiceStore();
  const clipUrls = new Map<string, string>();
  for (const m of chat?.messages ?? []) {
    if (m.kind === "reply" && typeof m.data.audioPath === "string") {
      const url = await voice.playUrl(m.data.audioPath).catch(() => null);
      if (url) clipUrls.set(m.id, url);
    }
  }
  const names = { childName: chat?.childPetName ?? "", parentName: chat?.parentPetName ?? "" };
  if (chat && ctx) {
    let lastDay = "";
    let lastDirection = "";
    for (const msg of chat.messages) {
      const day = dayLabel(msg.createdAt, chat.now, chat.timeZone);
      const separator = day.date !== lastDay ? await formatDayLabel(day) : undefined;
      const tail = separator !== undefined || msg.direction !== lastDirection;
      lastDay = day.date;
      lastDirection = msg.direction;
      const reply = msg.kind === "reply" ? replyLine(msg, names) : null;
      const lines = reply ? [] : bubbleLines(msg, ctx);
      const clip = clipUrls.get(msg.id);
      const canReply = replyAbout(msg, "child") !== null;
      rows.push({
        key: msg.id,
        separator,
        node: (
          <Bubble direction={msg.direction} time={formatTime(msg.createdAt)} tail={tail} read={msg.readAt !== null} ticksLabel={t(msg.readAt ? "read" : "sent")} testId={`bubble-${msg.kind}`}>
            {lines.map((line) => (
              <p key={line.key} className={line.key === "alarmOff" || line.key === "alarmOn" ? "text-sm text-[#54656f]" : ""}>
                {tb(line.key, line.values)}
              </p>
            ))}
            {msg.kind === "alert" && msg.refId && chat.alerts.get(msg.refId)?.kind === "review" && !chat.alerts.get(msg.refId)?.ackAt && (
              <form action={markReviewDoneAction.bind(null, msg.refId)}>
                <button type="submit" className="mt-1 inline-flex min-h-10 items-center font-medium text-[#01699a]" data-testid="review-done">
                  {t("reviewDone")}
                </button>
              </form>
            )}
            {msg.kind === "digest" && (
              <Link href={`/digest/${msg.refId}`} className="mt-1 inline-flex min-h-10 items-center font-medium text-[#01699a]">
                {t("openDigest")}
              </Link>
            )}
            {reply && <p data-testid="reply-text">{tr(reply.key, reply.values)}</p>}
            {clip && (
              <div className="-mx-1" data-testid="reply-audio">
                <VoiceNoteBubble src={clip} durationSec={10} seed={msg.id} />
              </div>
            )}
            {canReply && <ReplyBar messageId={msg.id} reaction={myReaction(msg)} react={reactChildAction} voiceReply={voiceReplyChildAction} />}
            <div>
              <DeleteMessage messageId={msg.id} canEveryone={isMyVoiceReply(msg)} childName={names.parentName} action={deleteChildMessageAction} namespace="chat.delete" />
            </div>
          </Bubble>
        ),
      });
    }
  }

  return (
    <>
      <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 bg-[#008069] px-1 pt-[env(safe-area-inset-top)] text-white">
        <Link href="/home" aria-label={t("back")} className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-white/10">
          <BackIcon />
        </Link>
        <AvatarCircle src={chat?.companion?.image ?? brand.icons.icon192} alt="" size={40} />
        <div className="min-w-0 flex-1 pl-1">
          <h1 className="truncate text-lg font-medium leading-tight">{name}</h1>
          <p className="truncate text-sm text-white">{subtitle}</p>
        </div>
      </header>

      <div className="flex-1 pb-3" data-testid="chat-messages">
        {rows.length === 0 && <p className="mt-6 text-center text-base text-[#54656f]">{t("empty")}</p>}
        {rows.map((row) => (
          <Fragment key={row.key}>
            {row.separator && <DaySeparator label={row.separator} />}
            {row.node}
          </Fragment>
        ))}
      </div>

      <footer className="sticky bottom-0 bg-[#f0f2f5] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-sm text-[#54656f]">
        {t("footer", { name, parentPetName: chat?.parentPetName || t("yourParent") })}{" "}
        <Link href="/reminders" className="font-medium text-[#005c4b] underline">
          {t("footerLink")}
        </Link>
      </footer>

      {chat && <MarkChatRead unread={unreadCount(chat.messages, chat.now)} />}
    </>
  );
}
