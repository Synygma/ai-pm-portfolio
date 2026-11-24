import { describe, expect, it } from "vitest";
import {
  addDays,
  convertLocalTime,
  isValidTimeZone,
  localDate,
  localTime,
  normalizeTimeZone,
  tzOffsetMinutes,
  zonedTimeToUtc,
} from "@/domain/time";

const LONDON = "Europe/London";
const IST = "Asia/Kolkata";

describe("time zones: London <-> IST", () => {
  it("IST is always UTC+5:30", () => {
    expect(tzOffsetMinutes(new Date("2026-01-15T12:00:00Z"), IST)).toBe(330);
    expect(tzOffsetMinutes(new Date("2026-07-15T12:00:00Z"), IST)).toBe(330);
  });

  it("London is UTC+0 in winter and UTC+1 in summer", () => {
    expect(tzOffsetMinutes(new Date("2026-01-15T12:00:00Z"), LONDON)).toBe(0);
    expect(tzOffsetMinutes(new Date("2026-07-15T12:00:00Z"), LONDON)).toBe(60);
  });

  it("turns a parent-local time into the right UTC instant", () => {
    expect(zonedTimeToUtc("2026-11-04", "08:30", IST).toISOString()).toBe("2026-11-04T03:00:00.000Z");
    expect(zonedTimeToUtc("2026-11-04", "19:00", LONDON).toISOString()).toBe("2026-11-04T19:00:00.000Z");
    expect(zonedTimeToUtc("2026-07-01", "19:00", LONDON).toISOString()).toBe("2026-07-01T18:00:00.000Z");
  });

  it("shows Maa's 08:30 IST medicine in Priya's London time (winter and summer)", () => {
    expect(convertLocalTime("2026-11-04", "08:30", IST, LONDON)).toEqual({ date: "2026-11-04", time: "03:00" });
    expect(convertLocalTime("2026-07-01", "08:30", IST, LONDON)).toEqual({ date: "2026-07-01", time: "04:00" });
  });

  it("crosses midnight correctly: Priya's 19:00 London digest is the next day in Lucknow", () => {
    expect(convertLocalTime("2026-11-04", "19:00", LONDON, IST)).toEqual({ date: "2026-11-05", time: "00:30" });
    expect(convertLocalTime("2026-07-01", "19:00", LONDON, IST)).toEqual({ date: "2026-07-01", time: "23:30" });
  });

  it("handles the days the clocks change in London", () => {
    // Last Sunday of March: 01:00 UTC -> clocks go forward. Last Sunday of October: back.
    expect(zonedTimeToUtc("2026-03-29", "09:00", LONDON).toISOString()).toBe("2026-03-29T08:00:00.000Z");
    expect(zonedTimeToUtc("2026-10-25", "09:00", LONDON).toISOString()).toBe("2026-10-25T09:00:00.000Z");
  });

  it("formats local date and time", () => {
    const instant = new Date("2026-11-04T20:15:00Z");
    expect(localDate(instant, IST)).toBe("2026-11-05");
    expect(localTime(instant, IST)).toBe("01:45");
    expect(localTime(instant, LONDON)).toBe("20:15");
  });

  it("does calendar arithmetic across months and years", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("maps old zone names to current ones", () => {
    expect(normalizeTimeZone("Asia/Calcutta")).toBe("Asia/Kolkata");
    expect(normalizeTimeZone(" Europe/London ")).toBe("Europe/London");
  });

  it("validates time zone names", () => {
    expect(isValidTimeZone(IST)).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
  });
});
