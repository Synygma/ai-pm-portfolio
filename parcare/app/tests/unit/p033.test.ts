// P-033: the parent can paste the link their child sent (iPhone home-screen app has no address bar).
import { describe, expect, it } from "vitest";
import { newInviteToken, tokenFromPasted } from "@/domain/invite";

describe("reading a pasted invite link", () => {
  const token = newInviteToken();
  it("takes the token from the whole link, with or without extra words or spaces", () => {
    expect(tokenFromPasted(`https://parcare-six.vercel.app/p/${token}`)).toBe(token);
    expect(tokenFromPasted(`  Open this: https://example.org/p/${token}?x=1 `)).toBe(token);
    expect(tokenFromPasted(token)).toBe(token);
  });
  it("refuses anything that is not a link", () => {
    expect(tokenFromPasted("hello")).toBeNull();
    expect(tokenFromPasted("https://parcare-six.vercel.app/p/setup")).toBeNull();
    expect(tokenFromPasted("")).toBeNull();
  });
});
