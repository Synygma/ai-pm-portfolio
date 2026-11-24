// Pure time-zone helpers built on Intl (no libraries). All instants are JS Dates / ISO strings in
// UTC; "local" values are wall-clock strings in a named IANA zone ("YYYY-MM-DD", "HH:MM").

export type ZonedParts = {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  second: number;
};

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, f);
  }
  return f;
}

/** Wall-clock parts of an instant in a time zone. */
export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts: Record<string, number> = {};
  for (const p of formatter(timeZone).formatToParts(instant)) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour === 24 ? 0 : parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

/** Offset of the zone from UTC at that instant, in minutes (London summer = 60, IST = 330). */
export function tzOffsetMinutes(instant: Date, timeZone: string): number {
  const p = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const whole = Math.floor(instant.getTime() / 1000) * 1000;
  return Math.round((asUtc - whole) / 60000);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM-DD" of the instant in the zone. */
export function localDate(instant: Date, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** "HH:MM" (24-hour) of the instant in the zone. */
export function localTime(instant: Date, timeZone: string): string {
  const p = zonedParts(instant, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Calendar arithmetic on a "YYYY-MM-DD" string. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

/** The UTC instant of a wall-clock date + time in a zone (handles DST changes). */
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let result = guess - tzOffsetMinutes(new Date(guess), timeZone) * 60000;
  const second = guess - tzOffsetMinutes(new Date(result), timeZone) * 60000;
  if (second !== result) result = second;
  return new Date(result);
}

/** Same instant shown as wall-clock time in another zone, e.g. parent IST -> child London. */
export function convertLocalTime(
  date: string,
  time: string,
  fromZone: string,
  toZone: string,
): { date: string; time: string } {
  const instant = zonedTimeToUtc(date, time, fromZone);
  return { date: localDate(instant, toZone), time: localTime(instant, toZone) };
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function addMinutes(instant: Date | string, minutes: number): Date {
  return new Date(new Date(instant).getTime() + minutes * 60000);
}

/** Old zone names some browsers still report, mapped to the current names. */
const ZONE_ALIASES: Record<string, string> = {
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Europe/Kiev": "Europe/Kyiv",
};

export function normalizeTimeZone(timeZone: string): string {
  const tz = timeZone.trim();
  return ZONE_ALIASES[tz] ?? tz;
}
