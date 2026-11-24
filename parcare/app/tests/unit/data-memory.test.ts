import { describe, expect, it } from "vitest";
import { camelToSnake, snakeToCamel, toCamelRow, toSnakeRow } from "@/data/case";
import { createMemoryRepos, emptySnapshot, MemoryStore } from "@/data/memory";
import type { HelperRequestRow } from "@/data/types";

function freshRepos() {
  const changes: number[] = [];
  const store = new MemoryStore(emptySnapshot(), () => changes.push(1));
  return { repos: createMemoryRepos(store), changes };
}

const helper = (over: Partial<HelperRequestRow> = {}): Omit<HelperRequestRow, "id"> => ({
  householdId: "h1",
  text: "Please fix the tap.",
  audioPath: null,
  status: "new",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

describe("memory adapter", () => {
  it("inserts with a generated UUID and reads it back", async () => {
    const { repos, changes } = freshRepos();
    const row = await repos.helperRequests.insert(helper());
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(await repos.helperRequests.get(row.id)).toEqual(row);
    expect(changes.length).toBe(1);
  });

  it("filters by equality, including null, and sorts", async () => {
    const { repos } = freshRepos();
    await repos.helperRequests.insertMany([
      helper({ householdId: "h1", createdAt: "2026-11-02T00:00:00.000Z" }),
      helper({ householdId: "h1", createdAt: "2026-11-01T00:00:00.000Z", audioPath: "h1/a.webm" }),
      helper({ householdId: "h2" }),
    ]);
    const h1 = await repos.helperRequests.find({ householdId: "h1" }, { orderBy: "createdAt" });
    expect(h1.map((r) => r.createdAt)).toEqual(["2026-11-01T00:00:00.000Z", "2026-11-02T00:00:00.000Z"]);
    expect(await repos.helperRequests.find({ householdId: "h1", audioPath: null })).toHaveLength(1);
    const newest = await repos.helperRequests.find({ householdId: "h1" }, { orderBy: "createdAt", desc: true, limit: 1 });
    expect(newest[0].createdAt).toBe("2026-11-02T00:00:00.000Z");
  });

  it("updates and removes", async () => {
    const { repos } = freshRepos();
    const row = await repos.helperRequests.insert(helper());
    const updated = await repos.helperRequests.update(row.id, { status: "done" });
    expect(updated.status).toBe("done");
    await repos.helperRequests.remove(row.id);
    expect(await repos.helperRequests.get(row.id)).toBeNull();
    await expect(repos.helperRequests.update(row.id, { status: "seen" })).rejects.toThrow();
  });

  it("returns copies, so callers cannot change stored data by accident", async () => {
    const { repos } = freshRepos();
    const row = await repos.helperRequests.insert(helper());
    row.status = "done";
    expect((await repos.helperRequests.get(row.id))?.status).toBe("new");
  });

  it("rejects duplicate ids", async () => {
    const { repos } = freshRepos();
    await repos.helperRequests.insert({ ...helper(), id: "same" });
    await expect(repos.helperRequests.insert({ ...helper(), id: "same" })).rejects.toThrow(/duplicate/);
  });
});

describe("camelCase <-> snake_case mapping (Supabase adapter)", () => {
  it("maps column names both ways", () => {
    for (const [camel, snake] of [
      ["gapAMinutes", "gap_a_minutes"],
      ["demoClockOffsetMs", "demo_clock_offset_ms"],
      ["prompted1At", "prompted1_at"],
      ["p256dh", "p256dh"],
      ["householdId", "household_id"],
    ]) {
      expect(camelToSnake(camel)).toBe(snake);
      expect(snakeToCamel(snake)).toBe(camel);
    }
  });

  it("converts only top-level keys (jsonb contents stay as stored)", () => {
    const row = { householdId: "h", data: { petName: "Maa" } };
    expect(toSnakeRow(row)).toEqual({ household_id: "h", data: { petName: "Maa" } });
  });

  it("normalises Postgres timestamps to ISO UTC", () => {
    const row = toCamelRow<{ createdAt: string; periodStart: string; label: string }>({
      created_at: "2026-11-04T08:30:00+00:00",
      period_start: "2026-11-04T09:00:00+05:30",
      label: "08:30",
    });
    expect(row).toEqual({ createdAt: "2026-11-04T08:30:00.000Z", periodStart: "2026-11-04T03:30:00.000Z", label: "08:30" });
  });
});
