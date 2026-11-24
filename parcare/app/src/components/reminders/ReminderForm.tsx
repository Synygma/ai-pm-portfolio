"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { createReminderAction } from "@/app/(app)/(tabs)/reminders/actions";
import { buttonStyles } from "@/components/ui/Screen";
import type { ReminderErrors } from "@/domain/reminders";
import { convertLocalTime } from "@/domain/time";
import { formatCalendarDate } from "@/i18n/date";
import { Recorder } from "./Recorder";

const input = "min-h-12 w-full rounded-lg border border-neutral-400 bg-white px-3 text-base";

// New voice reminder: record (or type a short note), pick the date and time in the PARENT's time
// zone (the child's own time is shown alongside), and how often it repeats.
export function ReminderForm(props: { parentPetName: string; parentTimeZone: string; childTimeZone: string; defaultDate: string }) {
  const t = useTranslations("reminders.form");
  const te = useTranslations("reminders.errors");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState(props.defaultDate);
  const [time, setTime] = useState("09:00");
  const [repeat, setRepeat] = useState("none");
  const [audio, setAudio] = useState<Blob | null>(null);
  const [errors, setErrors] = useState<ReminderErrors>({});
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  const child = date && /^\d\d:\d\d$/.test(time) ? convertLocalTime(date, time, props.parentTimeZone, props.childTimeZone) : null;

  function submit() {
    const data = new FormData();
    data.set("label", label);
    data.set("date", date);
    data.set("time", time);
    data.set("repeat", repeat);
    if (audio) data.set("audio", new File([audio], `reminder.${audio.type.includes("ogg") ? "ogg" : audio.type.includes("mp4") ? "m4a" : "webm"}`, { type: audio.type }));
    start(async () => {
      const r = await createReminderAction(data);
      if (!r) return; // redirected
      setErrors(r.errors ?? {});
      setFailed(Boolean(r.failed));
    });
  }

  const err = (k: keyof ReminderErrors) =>
    errors[k] ? (
      <p className="text-sm text-red-800" role="alert">
        {te(`${k}.${errors[k]}`)}
      </p>
    ) : null;

  return (
    <div className="flex flex-col gap-5 p-4">
      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t("voiceTitle", { parentPetName: props.parentPetName })}</h2>
        <Recorder onChange={setAudio} />
        {err("audio")}
      </section>

      <section className="flex flex-col gap-1">
        <label htmlFor="reminder-label" className="text-base font-semibold">
          {t("label")}
        </label>
        <input id="reminder-label" className={input} maxLength={80} value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("labelPlaceholder")} />
        <p className="text-sm text-[#54656f]">{t("labelHint")}</p>
        {err("label")}
        {err("content")}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold">{t("whenTitle", { parentPetName: props.parentPetName })}</h2>
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {t("date")}
            <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {t("time")}
            <input type="time" className={input} value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <p className="text-sm text-[#54656f]" data-testid="reminder-child-time">
          {child ? t("childTime", { date: formatCalendarDate(child.date, "en", "long"), time: child.time }) : ""}
        </p>
        {err("date")}
        {err("time")}
        <label className="flex flex-col gap-1 text-sm">
          {t("repeat")}
          <select className={input} value={repeat} onChange={(e) => setRepeat(e.target.value)}>
            <option value="none">{t("repeatNone")}</option>
            <option value="daily">{t("repeatDaily")}</option>
            <option value="weekly">{t("repeatWeekly")}</option>
          </select>
        </label>
      </section>

      {failed && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-base text-red-800">
          {te("failed")}
        </p>
      )}
      <button type="button" className={buttonStyles.primary} onClick={submit} disabled={pending}>
        {pending ? t("saving") : t("save")}
      </button>
      <p className="text-sm text-[#54656f]">{t("retention")}</p>
    </div>
  );
}
