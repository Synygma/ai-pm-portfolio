"use client";

// "Add a check-in" (P-040): for anything the voice reader missed, or when she would rather not speak.
// In her setup it adds to the list on the page (onAdd); in her Settings it is a form action that
// stores it straight away (adding it is her Yes, G1).

import { useTranslations } from "next-intl";
import { useActionState, useRef, useState } from "react";
import { buttonStyles } from "@/components/ui/Screen";
import { CHECKIN_TYPES, type CheckinType } from "@/data/types";
import { cleanNewCheckin, NEW_CHECKIN_MAX, type NewCheckin, timeChoices } from "@/domain/parent-setup";

type Result = { ok: boolean | null };
type Props =
  | { onAdd: (item: NewCheckin) => void; action?: never; childName?: never }
  | { action: (prev: Result, formData: FormData) => Promise<Result>; childName: string; onAdd?: never };

const DEFAULT_KIND: CheckinType = "medicine";
const box = "min-h-12 w-full rounded-xl border border-neutral-400 bg-white px-3 text-lg outline-none focus:border-[#008069] focus:ring-2 focus:ring-[#008069]/30";

export function AddCheckin(props: Props) {
  const t = useTranslations("parentSetup.add");
  const tt = useTranslations("checkinTypes");
  const [open, setOpen] = useState(false);
  const [bad, setBad] = useState(false);
  const [added, setAdded] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const serverAction = props.action;
  // Settings: once the server stored it, close the form and say so.
  const [, formAction, pending] = useActionState(async (prev: Result, formData: FormData): Promise<Result> => {
    if (!serverAction) return prev;
    const r = await serverAction(prev, formData);
    if (r.ok) {
      form.current?.reset();
      setOpen(false);
      setAdded(true);
    } else setBad(true);
    return r;
  }, { ok: null });

  if (!open) {
    return (
      <div>
        {added && (
          <p role="status" className="mb-2 rounded-xl bg-[#e7f5f1] p-3 text-lg text-[#005c4b]" data-testid="add-checkin-done">
            {t("done")}
          </p>
        )}
        <button
          type="button"
          className={`${buttonStyles.secondary} min-h-14 text-lg`}
          onClick={() => {
            setOpen(true);
            setAdded(false);
            setBad(false);
          }}
          data-testid="add-checkin-open"
        >
          {t("open")}
        </button>
      </div>
    );
  }

  function addHere(e: React.FormEvent<HTMLFormElement>) {
    if (!props.onAdd) return;
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const item = cleanNewCheckin({ label: f.get("label"), checkinType: f.get("checkinType"), localTime: String(f.get("time") ?? "") });
    if (!item) {
      setBad(true);
      return;
    }
    props.onAdd(item);
    setOpen(false);
    setAdded(true);
  }

  return (
    <form ref={form} action={props.action ? formAction : undefined} onSubmit={props.onAdd ? addHere : undefined} className="flex flex-col gap-3 rounded-xl border-2 border-[#008069] bg-white p-3" data-testid="add-checkin">
      <h3 className="text-xl font-semibold">{t("title")}</h3>
      <p className="text-lg text-[#54656f]">{t("hint")}</p>
      <label className="flex flex-col gap-1 text-lg font-medium">
        {t("what")}
        <input name="label" required maxLength={NEW_CHECKIN_MAX} className={box} placeholder={t("whatPlaceholder")} data-testid="add-checkin-label" />
      </label>
      <label className="flex flex-col gap-1 text-lg font-medium">
        {t("kind")}
        <select name="checkinType" defaultValue={DEFAULT_KIND} className={box} data-testid="add-checkin-kind">
          {CHECKIN_TYPES.map((c) => (
            <option key={c} value={c}>
              {tt(c)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-lg font-medium">
        {t("time")}
        <select name="time" defaultValue="" className={box} data-testid="add-checkin-time">
          <option value="">{t("noTime")}</option>
          {timeChoices().map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </label>
      {props.action && (
        <label className="flex min-h-12 items-center gap-3 text-lg">
          <input type="checkbox" name="share" defaultChecked className="h-7 w-7 shrink-0 accent-[#008069]" />
          {t("share", { childName: props.childName })}
        </label>
      )}
      {bad && (
        <p role="alert" className="rounded-xl bg-[#fdecea] p-3 text-lg text-[#b42318]">
          {t("bad")}
        </p>
      )}
      <div className="flex gap-3">
        <button type="submit" className={`${buttonStyles.primary} min-h-14 flex-1 text-lg`} disabled={pending} data-testid="add-checkin-save">
          {props.action ? t("saveOn") : t("add")}
        </button>
        <button type="button" className={`${buttonStyles.secondary} min-h-14 flex-1 text-lg`} onClick={() => setOpen(false)}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
