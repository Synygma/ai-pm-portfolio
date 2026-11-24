import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Fragment, Suspense } from "react";
import { reactParentAction, voiceReplyParentAction } from "@/app/p/(parent)/actions";
import { AnswerCard } from "@/components/parent/AnswerCard";
import { DeleteMessage } from "@/components/parent/DeleteMessage";
import { ParentHeader } from "@/components/parent/ParentHeader";
import { PushToggle } from "@/components/settings/PushToggle";
import { removeParentPushAction, saveParentPushAction } from "@/app/p/(parent)/settings/actions";
import { ReviewButtons } from "@/components/parent/ReviewButtons";
import { AutoRead, ReadAloudBar, ReadAloudButton } from "@/components/parent/ReadAloud";
import { ScrollToEnd } from "@/components/parent/ScrollToEnd";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { Bubble, DaySeparator } from "@/components/wa/Bubble";
import { ReplyBar } from "@/components/wa/ReplyBar";
import { getAvatar } from "@/config/brand";
import { VoiceNoteBubble } from "@/components/wa/VoiceNoteBubble";
import { loadAnswerable, type OpenCheckinView } from "@/data/parent-checkin-view";
import { requireParent } from "@/data/parent-access";
import { dayLabel, visibleMessages } from "@/domain/chat";
import { appNow } from "@/domain/clock";
import { parentBubble, parentMessages } from "@/domain/parent-chat";
import { isMyVoiceReply, myReaction, replyAbout, replyLine } from "@/domain/replies";
import { shareLink } from "@/domain/setup";
import { localTime } from "@/domain/time";
import { hiddenForHer, isHers } from "@/services/parent-messages";
import { getServiceVoiceStore } from "@/services/voice-store";
import { formatDayLabel } from "@/i18n/format";

// The parent's home: her chat with her companion. Reading messages aloud is optional (On / Off bar).
export default function ParentHomePage() {
  return (
    <Suspense fallback={<div className="min-h-16 bg-[#008069]" />}>
      <ParentChat />
    </Suspense>
  );
}

async function ParentChat() {
  const t = await getTranslations("parentApp");
  const tc = await getTranslations("parentChat");
  const tchat = await getTranslations("chat");
  const tr = await getTranslations("replies");
  const me = await requireParent();
  // Her own setup comes first (P2), then her chat.
  if (!me.parent.setupCompletedAt) redirect("/p/setup");
  const { household, parent, repos } = me;
  const now = appNow(household);
  const tz = parent.timeZone;
  const [messages, checkins, responses, requests] = await Promise.all([
    repos.chatMessages.find({ householdId: household.id }),
    repos.checkins.find({ householdId: household.id }),
    repos.responses.find({ householdId: household.id }),
    repos.helperRequests.find({ householdId: household.id }),
  ]);
  // Her help requests, shown in her chat as she sent them: her words and her voice note (P-028).
  const voice = getServiceVoiceStore();
  const sent = new Map(
    await Promise.all(
      requests.map(async (r) => [r.id, { text: r.text, audioUrl: r.audioPath ? await voice.playUrl(r.audioPath).catch(() => null) : null }] as const),
    ),
  );
  // Voice replies between her and the child (P-030): a short-lived link to each clip.
  const clipUrls = new Map<string, string>();
  for (const m of messages) {
    if (m.kind === "reply" && m.audience === "parent" && typeof m.data.audioPath === "string") {
      const url = await voice.playUrl(m.data.audioPath).catch(() => null);
      if (url) clipUrls.set(m.id, url);
    }
  }
  const replyNames = { childName: me.childName, parentName: me.firstName };
  const myChild = getAvatar("my-child");
  const metaTypes = new Map((await repos.metaItems.find({ householdId: household.id })).map((m) => [m.id, m.checkinType]));
  const ctx = {
    firstName: me.firstName,
    childName: me.childName,
    companionName: me.companion?.name ?? null,
    checkinTypes: new Map(checkins.flatMap((c) => (metaTypes.has(c.metaItemId) ? [[c.id, metaTypes.get(c.metaItemId)!] as const] : []))),
    responses: new Map(responses.map((r) => [r.id, r.text])),
    formatTime: (at: string) => localTime(new Date(at), tz),
  };
  // "Delete for me" hides a bubble in her chat only.
  const shown = visibleMessages(parentMessages(messages), now).filter((m) => !hiddenForHer(m));
  const tp = await getTranslations("parentApp.chat");
  const reviewsDone = new Set((await repos.reviewPrompts.find({ householdId: household.id, audience: "parent" })).filter((r) => r.doneAt).map((r) => r.id));
  // Every check-in she can still answer gets its answer buttons right under its question (P-029),
  // also after the child was told. The newest one is "the" answer card.
  const answerable = await loadAnswerable(me);
  const cardFor = new Map(answerable.map((v) => [v.checkin.id, v]));
  const lastAsk = new Map<string, string>();
  for (const m of shown) if (m.kind === "checkin" && m.refId && cardFor.has(m.refId)) lastAsk.set(m.refId, m.id);
  const card = (v: OpenCheckinView, inChat: boolean) => (
    <AnswerCard
      key={`card-${v.checkin.id}`}
      checkinId={v.checkin.id}
      question={v.question}
      snoozedUntil={v.snoozedUntil}
      canSnooze={v.checkin.status === "prompted1" || v.checkin.status === "prompted2"}
      childName={me.childName}
      contact={v.contact}
      inChat={inChat}
      childTold={v.checkin.status === "escalated" || v.checkin.status === "acknowledged"}
      testId={v === answerable[0] ? "answer-card" : "answer-card-earlier"}
    />
  );
  const placed = new Set<string>();

  let lastDay = "";
  let lastDirection = "";
  const rows: React.ReactNode[] = [];
  let newest: { id: string; text: string } | null = null;
  for (const msg of shown) {
    const day = dayLabel(msg.createdAt, now, tz);
    const separator = day.date !== lastDay ? await formatDayLabel(day) : null;
    const b = parentBubble(msg, ctx);
    const reply = msg.kind === "reply" ? replyLine(msg, replyNames) : null;
    const text = reply ? tr(reply.key, reply.values) : b.kind === "quote" ? `“${b.text}”` : b.lines.map((l) => tc(l.key, l.values)).join(" ");
    const clip = clipUrls.get(msg.id);
    // The child's own voice (never the companion's, G16): shown with the My Child picture.
    const fromChild = msg.kind === "reply" && msg.direction === "in";
    if (!text) continue;
    const time = localTime(new Date(msg.createdAt), tz);
    // A help request: first what she sent (her words, her voice note), then the companion's note.
    const request = msg.kind === "helper" && msg.refId ? sent.get(msg.refId) : undefined;
    const sentTail = separator !== null || lastDirection !== "out";
    const sentBubble = request ? (
      <Bubble direction="out" time={time} tail={sentTail} read ticksLabel={tchat("read")} testId="parent-bubble-request">
        {request.audioUrl && (
          <div className="-mx-1" data-testid="request-audio">
            <VoiceNoteBubble src={request.audioUrl} durationSec={10} seed={msg.refId ?? msg.id} />
          </div>
        )}
        {request.text && <p className="text-[18px] leading-snug">“{request.text}”</p>}
        <DeleteMessage messageId={msg.id} canEveryone childName={me.childName} />
      </Bubble>
    ) : null;
    if (sentBubble) lastDirection = "out";
    const tail = (separator !== null && !sentBubble) || msg.direction !== lastDirection;
    lastDay = day.date;
    lastDirection = msg.direction;
    if (msg.direction === "in") newest = { id: msg.id, text };
    const ask = msg.refId && lastAsk.get(msg.refId) === msg.id ? cardFor.get(msg.refId) : undefined;
    if (ask) placed.add(ask.checkin.id);
    rows.push(
      <Fragment key={msg.id}>
        {separator && <DaySeparator label={separator} />}
        {sentBubble}
        <Bubble direction={msg.direction} time={time} tail={tail} read ticksLabel={tchat("read")} testId={`parent-bubble-${msg.kind}`}>
          {fromChild ? (
            <div className="flex items-start gap-2">
              <AvatarCircle src={myChild.image} alt={tp("myChildPicture")} size={36} />
              <p className="text-[18px] leading-snug">{text}</p>
            </div>
          ) : (
            <p className="text-[18px] leading-snug">{text}</p>
          )}
          {clip && (
            <div className="-mx-1" data-testid="reply-audio">
              <VoiceNoteBubble src={clip} durationSec={10} seed={msg.id} />
            </div>
          )}
          {replyAbout(msg, "parent") && (
            <ReplyBar messageId={msg.id} reaction={myReaction(msg)} react={reactParentAction} voiceReply={voiceReplyParentAction} note={tr("notEmergency")} />
          )}
          <div className="flex flex-wrap items-center gap-x-2">
            {msg.direction === "in" && <ReadAloudButton text={text} onlyWhenOn />}
            {/* For a help request, the request bubble above carries the delete. */}
            {!sentBubble && <DeleteMessage messageId={msg.id} canEveryone={isHers(msg) || isMyVoiceReply(msg)} childName={me.childName} />}
          </div>
          {msg.kind === "checkin" && msg.data.photoPrompt === true && (
            <a
              href={shareLink(tp("shareText", { childName: me.childName }))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex min-h-12 items-center justify-center rounded-full bg-[#008069] px-4 text-base font-semibold text-white"
              data-testid="share-photo"
            >
              {tp("shareChild", { childName: me.childName })}
            </a>
          )}
          {msg.kind === "review" && msg.refId && (
            reviewsDone.has(msg.refId) ? (
              <p className="mt-1 text-base text-[#54656f]">{tp("reviewDone")}</p>
            ) : (
              <ReviewButtons promptId={msg.refId} />
            )
          )}
        </Bubble>
        {ask && card(ask, true)}
      </Fragment>,
    );
  }
  // A check-in whose question is not in her chat (hidden with "Delete for me"): its card at the end.
  const leftOver = answerable.filter((v) => !placed.has(v.checkin.id));

  return (
    <div className="flex flex-1 flex-col bg-[#EFEAE2]">
      <ParentHeader companion={me.companion} />
      <ReadAloudBar />
      <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} save={saveParentPushAction} remove={removeParentPushAction} namespace="parentApp.push" nudge />
      <div className="flex-1 pb-4" data-testid="parent-chat">
        {rows.length === 0 ? <p className="mt-6 text-center text-lg text-[#54656f]">{t("empty")}</p> : rows}
      </div>
      {leftOver.map((v) => card(v, false))}
      {newest && <AutoRead id={newest.id} text={newest.text} />}
      <ScrollToEnd />
    </div>
  );
}
