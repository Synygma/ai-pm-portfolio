import { getLocale, getTranslations } from "next-intl/server";
import type { DayLabel } from "@/domain/chat";

import { formatCalendarDate } from "./date";

export { formatCalendarDate };

/** "Today", "Yesterday" or the date. */
export async function formatDayLabel(label: DayLabel, style: "long" | "short" = "long"): Promise<string> {
  const t = await getTranslations("chat");
  if (label.kind === "today") return t("today");
  if (label.kind === "yesterday") return t("yesterday");
  return formatCalendarDate(label.date, await getLocale(), style);
}
