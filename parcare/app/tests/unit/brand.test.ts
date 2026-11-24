import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import {
  AVATAR_IDS,
  avatars,
  brand,
  isSelectableCompanion,
  MY_CHILD_AVATAR_ID,
  selectableCompanions,
} from "@/config/brand";
import en from "../../messages/en.json";

const publicFile = (p: string) => path.join(process.cwd(), "public", p);

describe("avatar list", () => {
  it("has the 12 avatars in the agreed order", () => {
    expect(avatars.map((a) => a.id)).toEqual([
      "krishna", "shiva", "guruji", "trekker", "champ", "explorer",
      "sangeet-saathi", "kalakaar", "garden-mitra", "masterchef", "vidya", "my-child",
    ]);
  });

  it('"My Child" is not selectable as an AI companion', () => {
    expect(isSelectableCompanion(MY_CHILD_AVATAR_ID)).toBe(false);
    expect(selectableCompanions.map((a) => a.id)).not.toContain(MY_CHILD_AVATAR_ID);
    expect(avatars.find((a) => a.id === MY_CHILD_AVATAR_ID)?.selectable).toBe(false);
  });

  it("offers exactly the other 11 as AI companions", () => {
    expect(selectableCompanions).toHaveLength(11);
    for (const a of selectableCompanions) expect(isSelectableCompanion(a.id)).toBe(true);
  });

  it("rejects unknown ids", () => {
    expect(isSelectableCompanion("not-an-avatar")).toBe(false);
    expect(isSelectableCompanion("")).toBe(false);
  });

  it("has a fixed English name and style line for every avatar (never translated)", () => {
    expect(avatars.map((a) => a.id)).toEqual([...AVATAR_IDS]);
    for (const a of avatars) {
      expect(a.name.trim(), a.id).toBeTruthy();
      expect(a.style.trim(), a.id).toBeTruthy();
    }
    expect(avatars.find((a) => a.id === "vidya")?.name).toBe("Vidya");
    expect("avatars" in en).toBe(false);
  });

  it("has a cropped image file for every avatar", () => {
    for (const a of avatars) expect(existsSync(publicFile(a.image)), a.image).toBe(true);
  });
});

describe("app icons and manifest", () => {
  it("has every generated icon file", () => {
    for (const p of Object.values(brand.icons)) expect(existsSync(publicFile(p)), p).toBe(true);
    for (const f of ["favicon.ico", "icon.png", "apple-icon.png"]) {
      expect(existsSync(path.join(process.cwd(), "src", "app", f)), f).toBe(true);
    }
  });

  it("names the app ParCare and includes a maskable icon", () => {
    const m = manifest();
    expect(m.name).toBe("ParCare");
    expect(m.short_name).toBe("ParCare");
    expect(m.display).toBe("standalone");
    expect(m.icons?.some((i) => i.purpose === "maskable" && i.sizes === "512x512")).toBe(true);
    expect(m.icons?.some((i) => i.sizes === "192x192")).toBe(true);
  });
});
