// Calendar-date formatting that works in the browser and on the server (no next-intl imports).

// Day-month-year order (as used in India and the UK) for each app language.
const DATE_LOCALES: Record<string, string> = { en: "en-GB" };

/** Formats a "YYYY-MM-DD" calendar date. The date is already local, so it is formatted as UTC. */
export function formatCalendarDate(date: string, locale: string, style: "long" | "short"): string {
  const [y, m, d] = date.split("-").map(Number);
  const options: Intl.DateTimeFormatOptions =
    style === "long" ? { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" } : { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? locale, options).format(new Date(Date.UTC(y, m - 1, d)));
}
