import { readdirSync, readFileSync } from "node:fs";
import { planReviews } from "@/domain/review";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { verifyPassword } from "@/auth/password";
import { isSelectableCompanion } from "@/config/brand";
import { DEMO_CHILD_EMAIL, DEMO_CHILD_PASSWORD } from "@/config/demo";
import { camelToSnake } from "@/data/case";
import { UNIQUE_KEYS } from "@/data/memory";
import { buildSeed, ESCALATION_DAY, ESCALATION_LATE_ANSWER, HISTORY_DAYS, PARENT_TZ } from "@/data/seed";
import { NON_HOUSEHOLD_TABLES, TABLE_NAMES } from "@/data/types";
import { addDays, localDate, localTime } from "@/domain/time";

const NOW = new Date("2026-11-04T12:00:00Z");
const seed = buildSeed({ now: NOW });
const household = seed.households[0];
const metaByLabel = (label: string) => seed.metaItems.find((m) => m.label === label)!;

describe("seed data (fictional)", () => {
  it("has Priya in London and Kamla ('Maa') in Lucknow with Vidya as companion", () => {
    expect(seed.profiles[0]).toMatchObject({ fullName: "Priya Sharma", petName: "Gudiya", age: 41, timeZone: "Europe/London", email: DEMO_CHILD_EMAIL });
    expect(seed.parentProfiles[0]).toMatchObject({ name: "Kamla Sharma", petName: "Maa", age: 72, city: "Lucknow", timeZone: "Asia/Kolkata", managed: true });
    expect(household.parentAvatarId).toBe("vidya");
    expect(isSelectableCompanion(household.parentAvatarId!)).toBe(true);
    expect(household.managedParentId).toBe(seed.parentProfiles[0].id);
  });

  it("has a demo login whose password matches the README", () => {
    const user = seed.authUsers[0];
    expect(user.email).toBe(DEMO_CHILD_EMAIL);
    expect(user.id).toBe(household.childId);
    expect(verifyPassword(DEMO_CHILD_PASSWORD, user.passwordHash)).toBe(true);
  });

  it("uses the agreed escalation gaps: prompt 2 after 10 min, child alarm 20 min later", () => {
    expect(household.gapAMinutes).toBe(10);
    expect(household.gapBMinutes).toBe(20);
    expect(household.digestLocalTime).toBe("19:00");
  });

  it("has one active consent per check-in item, at the agreed times", () => {
    const times = Object.fromEntries(seed.metaItems.map((m) => [m.label, m.localTime]));
    expect(times).toMatchObject({
      "Woken up": "06:00",
      "Morning walk": "06:30",
      "BP medicine (morning)": "08:30",
      "Evening puja": "18:30",
      "BP medicine (evening)": "20:30",
      "Last check-in of the day": "21:00",
    });
    expect(seed.consents).toHaveLength(seed.metaItems.length);
    for (const m of seed.metaItems) {
      const consent = seed.consents.filter((c) => c.metaItemId === m.id);
      expect(consent, m.label).toHaveLength(1);
      expect(consent[0].revokedAt).toBeNull();
    }
  });

  it("has one doctor appointment next week", () => {
    const appt = seed.metaItems.filter((m) => m.checkinType === "appointment");
    expect(appt).toHaveLength(1);
    expect(appt[0].onDate).toBe(addDays(localDate(NOW, PARENT_TZ), 6));
  });

  it("keeps check-in times right in the parent's time zone", () => {
    const med = metaByLabel("BP medicine (morning)");
    for (const c of seed.checkins.filter((x) => x.metaItemId === med.id)) {
      expect(localTime(new Date(c.dueAt), PARENT_TZ)).toBe("08:30");
    }
    expect(new Set(seed.checkins.map((c) => localDate(new Date(c.dueAt), PARENT_TZ))).size).toBe(HISTORY_DAYS);
  });

  it("has exactly one past escalation, acknowledged, with factual alert data", () => {
    const escalated = seed.checkins.filter((c) => c.escalatedAt);
    expect(escalated).toHaveLength(1);
    const c = escalated[0];
    expect(c.status).toBe("acknowledged");
    const due = new Date(c.dueAt).getTime();
    expect(new Date(c.prompted2At!).getTime() - due).toBe(10 * 60000);
    expect(new Date(c.escalatedAt!).getTime() - new Date(c.prompted2At!).getTime()).toBe(20 * 60000);
    expect(localDate(new Date(c.dueAt), PARENT_TZ)).toBe(addDays(localDate(NOW, PARENT_TZ), -ESCALATION_DAY));
    const missed = seed.alerts.filter((a) => a.kind === "missed_checkin");
    expect(missed).toHaveLength(1);
    expect(missed[0]).toMatchObject({ checkinId: c.id, ackAt: c.acknowledgedAt });
    expect(seed.responses.find((r) => r.checkinId === c.id)?.text).toBe(ESCALATION_LATE_ANSWER);
  });

  it("has digests whose quotes match the stored responses exactly", () => {
    expect(seed.digests.length).toBeGreaterThanOrEqual(6);
    const byId = new Map(seed.responses.map((r) => [r.id, r]));
    for (const d of seed.digests) {
      expect(d.items.length, d.sentAt).toBeGreaterThan(0);
      for (const item of d.items) {
        expect(byId.get(item.responseId)?.text).toBe(item.quote);
        expect(new Date(item.at) > new Date(d.periodStart) && new Date(item.at) <= new Date(d.periodEnd)).toBe(true);
      }
      expect(new Date(d.sentAt) <= NOW).toBe(true);
    }
  });

  it("flags the one day without a walk, as a fact and never a diagnosis", () => {
    const flags = seed.digests.flatMap((d) => d.flags);
    expect(flags).toEqual([expect.objectContaining({ label: "Morning walk", kind: "not_done", usualLocalTime: "06:30" })]);
  });

  it("has two helper requests (one done), one sample reminder and a confirmed emergency contact", () => {
    expect(seed.helperRequests.map((h) => h.status).sort()).toEqual(["done", "new"]);
    expect(seed.childReminders).toHaveLength(1);
    expect(seed.childReminders[0]).toMatchObject({ isSample: true, audioPath: null, status: "scheduled" });
    expect(seed.emergencyContacts).toHaveLength(1);
    expect(seed.emergencyContacts[0].name).toContain("Mrs. Verma");
    expect(seed.emergencyContacts[0].confirmedToldAt).toBeTruthy();
  });

  it("records the child's terms acceptance and review prompts at +1 week (child) and +2 weeks (parent)", () => {
    expect(seed.termsAcceptances[0]).toMatchObject({ role: "child", userId: household.childId });
    const setup = new Date(household.setupCompletedAt!).getTime();
    const due = (aud: string) => new Date(seed.reviewPrompts.find((r) => r.audience === aud)!.dueAt).getTime() - setup;
    expect(due("child")).toBe(7 * 24 * 3600000);
    expect(due("parent")).toBe(14 * 24 * 3600000);
  });

  it("shows the +1 week review prompt as a chat bubble (not yet done) and plans the next one 3 months later", () => {
    const child = seed.reviewPrompts.filter((r) => r.audience === "child").sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    expect(child).toHaveLength(2);
    expect(child[0].shownAt).toBe(child[0].dueAt);
    expect(new Date(child[0].dueAt) <= NOW).toBe(true);
    expect(new Date(child[1].dueAt).getTime() - new Date(child[0].dueAt).getTime()).toBe(91 * 24 * 3600000);
    const review = seed.alerts.find((a) => a.kind === "review")!;
    expect(review).toMatchObject({ ackAt: null, data: { reviewPromptId: child[0].id } });
    expect(seed.chatMessages.some((m) => m.kind === "alert" && m.refId === review.id)).toBe(true);
    // A first tick on the sample data has nothing new to show.
    expect(planReviews(seed.reviewPrompts, NOW)).toEqual([]);
  });

  it("scopes every row to the one demo household", () => {
    for (const name of TABLE_NAMES) {
      if (NON_HOUSEHOLD_TABLES.has(name)) continue;
      for (const row of seed[name] as { householdId: string }[]) expect(row.householdId, name).toBe(household.id);
    }
  });

  it("is repeatable: same ids for the same input", () => {
    const again = buildSeed({ now: NOW });
    expect(again.checkins.map((c) => c.id)).toEqual(seed.checkins.map((c) => c.id));
  });
});

describe("Supabase migration matches the TypeScript row types", () => {
  // Every migration, in order (later ones add tables and columns).
  const dir = path.join(process.cwd(), "supabase", "migrations");
  const sql = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n");

  function columnsOf(table: string): string[] {
    const match = sql.match(new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`));
    if (!match) return [];
    const added = [...sql.matchAll(new RegExp(`alter table public\\.${table}\\s+add column (\\w+)`, "g"))].map((m) => m[1]);
    return match[1]
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("--") && !l.startsWith("'") && !l.startsWith(")"))
      .map((l) => l.split(/\s+/)[0].replace(/"/g, ""))
      .filter((w) => /^[a-z0-9_]+$/.test(w) && w !== "parent_avatar_id_check")
      .concat(added);
  }

  it("the sample-data adapter enforces the same unique rules as the database", () => {
    const fromSql = new Set<string>();
    // Inline "unique" columns in create table, minus constraints dropped later.
    for (const m of sql.matchAll(/create table public\.(\w+) \(([\s\S]*?)\n\);/g)) {
      for (const line of m[2].split("\n")) {
        const col = line.trim().split(/\s+/)[0];
        if (/\bunique\b/.test(line) && !line.trim().startsWith("--")) {
          const dropped = sql.includes(`drop constraint if exists ${m[1]}_${col}_key`);
          if (!dropped) fromSql.add(`${m[1]}(${col})`);
        }
      }
    }
    for (const m of sql.matchAll(/create unique index if not exists \w+ on public\.(\w+) \(([^)]+)\)/g)) {
      fromSql.add(`${m[1]}(${m[2].split(",").map((c) => c.trim()).join(",")})`);
    }
    const fromMemory = new Set(
      Object.entries(UNIQUE_KEYS).flatMap(([table, keys]) => (keys ?? []).map((k) => `${camelToSnake(table)}(${k.map(camelToSnake).join(",")})`)),
    );
    expect([...fromMemory].sort()).toEqual([...fromSql].sort());
  });

  it("creates every table", () => {
    for (const name of TABLE_NAMES) expect(columnsOf(camelToSnake(name)).length, name).toBeGreaterThan(0);
  });

  it("has a column for every field of every seeded row", () => {
    for (const name of TABLE_NAMES) {
      const rows = seed[name] as Record<string, unknown>[];
      if (rows.length === 0) continue;
      const cols = columnsOf(camelToSnake(name));
      for (const key of Object.keys(rows[0])) expect(cols, `${name}.${key}`).toContain(camelToSnake(key));
    }
  });

  it("enables row-level security and never allows 'my-child' as the companion", () => {
    expect(sql).toContain("alter table public.households enable row level security");
    expect(sql).toMatch(/parent_avatar_id in \([\s\S]*?'vidya'\s*\)/);
    const allowed = sql.match(/parent_avatar_id in \(([\s\S]*?)\)/)![1];
    expect(allowed).not.toContain("my-child");
  });
});
