import { describe, expect, it } from "vitest";
import { findEmergencyWord } from "@/domain/emergency";

describe("emergency-word detection", () => {
  it.each([
    ["Help me, I fell in the bathroom", "help me"],
    ["I FELL near the stairs", "i fell"],
    ["I can't breathe properly", "can't breathe"],
    ["I can’t breathe", "can't breathe"],
    ["Having chest pain since morning", "chest pain"],
    ["Please call an ambulance", "ambulance"],
    ["This is urgent", "urgent"],
    ["emergency!!", "emergency"],
    ["I have fallen and cannot get up", "i have fallen"],
  ])("detects: %s", (text, phrase) => {
    expect(findEmergencyWord(text)).toBe(phrase);
  });

  it.each([
    "I fell asleep watching TV",
    "The help arrived at 9",
    "Help has arrived, all good",
    "Can someone help with the groceries?",
    "Ask the helper to come tomorrow",
    "Nothing urgent, just call me later",
    "It is not an emergency",
    "No chest pain today, feeling fine",
    "I felt fine after my walk",
    "Took my tablet",
  ])("does not trigger on: %s", (text) => {
    expect(findEmergencyWord(text)).toBeNull();
  });

  it("bare 'help' is not a trigger", () => {
    expect(findEmergencyWord("help")).toBeNull();
    expect(findEmergencyWord("I need some help with the TV remote")).toBeNull();
  });
});
