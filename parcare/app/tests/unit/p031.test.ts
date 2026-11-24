// P-031 (team test): her setup's "If you do not answer" step had Next greyed out, because new
// families start with a 20-minute gap that was not on her list.
import { describe, expect, it } from "vitest";
import { buildSeed } from "@/data/seed";
import { GAP_CHOICES, nearestGap } from "@/domain/parent-setup";

describe("reminder gaps in her setup", () => {
  it("offer the starting gaps of every family (10 and 20 minutes)", () => {
    const h = buildSeed({ now: new Date("2026-11-15T04:00:00Z") }).households[0];
    expect(GAP_CHOICES).toContain(h.gapAMinutes);
    expect(GAP_CHOICES).toContain(h.gapBMinutes);
    expect(GAP_CHOICES).toContain(20);
  });
  it("a saved value not on the list snaps to the nearest choice", () => {
    expect(nearestGap(20)).toBe(20);
    expect(nearestGap(25)).toBe(20);
    expect(nearestGap(45)).toBe(30);
    expect(nearestGap(999)).toBe(60);
    expect(nearestGap(undefined)).toBe(10);
  });
});
