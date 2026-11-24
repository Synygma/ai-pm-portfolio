// P-036: the shared sample family piled up alarms all day on the live site (nobody plays Maa).
import { describe, expect, it } from "vitest";
import { createMemoryRepos, MemoryStore } from "@/data/memory";
import { buildSeed } from "@/data/seed";
import { tickAllHouseholds } from "@/services/checkins";

const NOW = new Date("2026-11-17T04:00:00Z");

describe("the every-minute scheduler", () => {
  it("skips the sample family (it runs only while someone has the demo open)", async () => {
    const repos = createMemoryRepos(new MemoryStore(buildSeed({ now: NOW })));
    expect((await tickAllHouseholds(repos, NOW.getTime())).households).toBe(0);
  });
  it("still runs every real family", async () => {
    const snap = buildSeed({ now: NOW });
    const repos = createMemoryRepos(new MemoryStore(snap));
    await repos.profiles.update(snap.profiles[0].id, { email: "someone@example.org" });
    expect((await tickAllHouseholds(repos, NOW.getTime())).households).toBe(1);
  });
});
