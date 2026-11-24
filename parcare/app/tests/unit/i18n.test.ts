import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";

// Walks a nested messages object and returns every leaf as [key, value].
function leaves(obj: unknown, prefix = ""): [string, unknown][] {
  if (obj === null || typeof obj !== "object") return [[prefix, obj]];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    leaves(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("messages/en.json", () => {
  it("has only non-empty string values", () => {
    for (const [key, value] of leaves(en)) {
      expect(typeof value, key).toBe("string");
      expect((value as string).trim().length, key).toBeGreaterThan(0);
    }
  });

  it("never uses the WhatsApp name in user-facing text", () => {
    for (const [key, value] of leaves(en)) {
      expect(String(value).toLowerCase(), key).not.toContain("whatsapp");
    }
  });
});
