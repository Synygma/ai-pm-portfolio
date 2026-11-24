// P-034 (team test): one phone used as a child in one family and as a parent in another could not
// get notifications for the second role (the push address was allowed only once in the database).
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";

const NOW = new Date("2026-11-16T04:00:00Z");

describe("one phone, both apps", () => {
  it("the same push address can be saved for the child and for the parent, in any family", async () => {
    const snap = buildSeed({ now: NOW });
    const repos = createMemoryRepos(new MemoryStore(snap));
    const householdId = snap.households[0].id;
    const row = { householdId, userId: null, endpoint: "https://push.example/abc", p256dh: "k", auth: "a", createdAt: NOW.toISOString() };
    await repos.pushSubscriptions.insert({ ...row, audience: "child" });
    await repos.pushSubscriptions.insert({ ...row, audience: "parent" });
    await repos.pushSubscriptions.insert({ ...row, householdId: "another-family", audience: "parent" });
    expect(await repos.pushSubscriptions.find({ endpoint: row.endpoint })).toHaveLength(3);
    // The same address twice for the same side of the same family is still refused.
    await expect(repos.pushSubscriptions.insert({ ...row, audience: "parent" })).rejects.toThrow();
  });
});
