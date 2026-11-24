// Parent app P1: sessions from the invite link, chat separation, parent chat wording.
import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import { childMessages, visibleMessages } from "@/domain/chat";
import { parentBubble, parentMessages } from "@/domain/parent-chat";
import { addMinutes } from "@/domain/time";
import { checkInvite, createParentSession, PARENT_SESSION_DAYS, redeemInvite, revokeParentSessions, verifyParentSession } from "@/services/parent-session";
import { purgeOldData } from "@/services/retention";
import { newParentInvite } from "@/services/setup";
import messages from "../../messages/en.json";

const NOW = new Date("2026-11-07T10:00:00Z");

function seeded() {
  const snap = buildSeed({ now: NOW });
  return { snap, repos: createMemoryRepos(new MemoryStore(snap)), household: snap.households[0], parent: snap.parentProfiles[0] };
}

describe("parent sessions (no password, 90 days)", () => {
  it("a token works until it expires; only a hash of the secret is stored", async () => {
    const { repos, household, parent } = seeded();
    const { token, expiresAt } = await createParentSession(repos, household.id, parent.id, NOW);
    expect(expiresAt.getTime() - NOW.getTime()).toBe(PARENT_SESSION_DAYS * 24 * 3600000);
    const row = await verifyParentSession(repos, token, NOW);
    expect(row?.parentId).toBe(parent.id);
    expect(row!.secretHash).not.toContain(token.split(".")[1]);
    expect(await verifyParentSession(repos, token, addMinutes(expiresAt, 1))).toBeNull();
  });

  it("refuses tampered, malformed and revoked tokens", async () => {
    const { repos, household, parent } = seeded();
    const { token } = await createParentSession(repos, household.id, parent.id, NOW);
    const [id] = token.split(".");
    expect(await verifyParentSession(repos, `${id}.wrong-secret`, NOW)).toBeNull();
    expect(await verifyParentSession(repos, "nonsense", NOW)).toBeNull();
    expect(await verifyParentSession(repos, null, NOW)).toBeNull();
    await revokeParentSessions(repos, household.id, NOW);
    expect(await verifyParentSession(repos, token, NOW)).toBeNull();
  });
});

describe("invite link redemption", () => {
  it("checking does not use the link up; opening it does, once, and signs older phones out", async () => {
    const { repos, household, parent } = seeded();
    const old = await createParentSession(repos, household.id, parent.id, NOW);
    const { token } = await newParentInvite(repos, household.id, NOW);
    expect((await checkInvite(repos, token, NOW)).ok).toBe(true);
    expect((await checkInvite(repos, token, NOW)).ok).toBe(true); // a link preview changes nothing
    const r = await redeemInvite(repos, token, NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect((await verifyParentSession(repos, r.token, NOW))?.parentId).toBe(parent.id);
    expect(await verifyParentSession(repos, old.token, NOW)).toBeNull();
    expect(await redeemInvite(repos, token, NOW)).toMatchObject({ ok: false, reason: "used", householdId: household.id });
  });

  it("refuses expired, unknown and malformed links; a new link replaces an unused one", async () => {
    const { repos, household } = seeded();
    const { token } = await newParentInvite(repos, household.id, NOW);
    expect(await checkInvite(repos, token, addMinutes(NOW, 8 * 24 * 60))).toMatchObject({ ok: false, reason: "expired" });
    expect(await checkInvite(repos, "x".repeat(43), NOW)).toEqual({ ok: false, reason: "invalid" });
    expect(await checkInvite(repos, "../../etc", NOW)).toEqual({ ok: false, reason: "invalid" });
    await newParentInvite(repos, household.id, NOW);
    expect((await checkInvite(repos, token, NOW)).ok).toBe(false);
  });
});

describe("two chats: the child's and the parent's", () => {
  it("the sample data has Kamla's own chat, which never shows in Priya's", () => {
    const { snap } = seeded();
    const mine = parentMessages(snap.chatMessages);
    expect(mine.length).toBeGreaterThan(5);
    expect(mine.some((m) => m.kind === "answer" && m.direction === "out")).toBe(true);
    const child = childMessages(snap.chatMessages);
    expect(child.some((m) => m.audience === "parent")).toBe(false);
    expect(child.length + mine.length).toBe(snap.chatMessages.length);
    // Old rows without an audience belong to the child.
    expect(childMessages([{ audience: undefined }])).toHaveLength(1);
  });

  it("companion lines: an AI, never the child; her answers are shown exactly", () => {
    const { snap } = seeded();
    const t = createTranslator({ locale: "en", messages, namespace: "parentChat" }) as unknown as (key: string, values?: Record<string, string | number>) => string;
    const responses = new Map(snap.responses.map((r) => [r.id, r.text]));
    const ctx = { firstName: "Kamla", childName: "Gudiya", companionName: "Vidya", checkinTypes: new Map(), responses, formatTime: () => "10:30" };
    const hello = parentBubble(parentMessages(snap.chatMessages).find((m) => m.kind === "setup")!, ctx);
    expect(hello.kind).toBe("lines");
    const text = hello.kind === "lines" ? hello.lines.map((l) => t(l.key, l.values)).join(" ") : "";
    expect(text).toContain("Vidya, your ParCare AI companion. I am an AI voice, not a person.");
    const answer = parentMessages(snap.chatMessages).find((m) => m.kind === "answer")!;
    expect(parentBubble(answer, ctx)).toEqual({ kind: "quote", text: responses.get(answer.refId!) });
    // Every check-in type has a prompt.
    for (const type of ["woken_up", "medicine", "help_arrived", "social", "physical_activity", "puja", "appointment", "last_checkin"]) {
      expect(t(`prompt.${type}`, { firstName: "Kamla" })).toContain("Kamla");
    }
  });

  it("her answer bubble goes when the keeping period deletes the answer", async () => {
    const { repos, household } = seeded();
    const later = addMinutes(NOW, 10 * 24 * 60);
    await purgeOldData(repos, { ...household, retentionDays: 8 }, later);
    const ids = new Set((await repos.responses.find({})).map((r) => r.id));
    for (const m of await repos.chatMessages.find({ kind: "answer" })) expect(ids.has(m.refId!)).toBe(true);
    expect(visibleMessages(parentMessages(await repos.chatMessages.find({})), later).length).toBeGreaterThan(0);
  });
});
