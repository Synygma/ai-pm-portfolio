"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { type FollowUp, finishParentSetupAction, saveParentDraftAction, understandDayAction } from "@/app/p/(parent)/setup/actions";
import { PushToTalk } from "@/components/setup/PushToTalk";
import { buttonStyles } from "@/components/ui/Screen";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import type { VoiceGender } from "@/config/brand";
import { GAP_CHOICES, nearestGap, PARENT_SETUP_LAYOUT, PARENT_SETUP_STEPS, type ParentItem, SOFT_LIMIT_MINUTES, timeChoices } from "@/domain/parent-setup";
import { AddCheckin } from "./AddCheckin";
import { ReadAloudButton, setCompanionVoice } from "./ReadAloud";

export type WizardState = {
  /** Step layout version (see PARENT_SETUP_LAYOUT). */
  layout: number;
  step: number;
  companionId: string;
  transcript: string;
  parts: { morning: string; afternoon: string; evening: string };
  usingParts: boolean;
  items: ParentItem[];
  followUps: FollowUp[];
  followUpIndex: number;
  summaryToChild: boolean;
  gapA: number;
  gapB: number;
  startedAt: string | null;
};

type Companion = { id: string; name: string; style: string; image: string; voice: VoiceGender };

const big = "min-h-14 text-lg";
const box = "w-full rounded-xl border border-neutral-400 bg-white p-3 text-lg outline-none focus:border-[#008069] focus:ring-2 focus:ring-[#008069]/30";

/** Her list in the order of her day (items without a time last). */
const byTime = (items: ParentItem[]) => [...items].sort((a, b) => (a.localTime ?? "99").localeCompare(b.localTime ?? "99"));

/** A companion line with its read-aloud button. */
function Says({ text }: { text: string }) {
  return (
    <div className="rounded-2xl rounded-tl-none bg-white p-4 shadow-sm">
      <p className="text-xl leading-snug">{text}</p>
      <ReadAloudButton text={text} />
    </div>
  );
}

export function ParentSetupWizard(props: { initial: WizardState; firstName: string; childName: string; companions: Companion[]; terms: React.ReactNode; notifications?: React.ReactNode }) {
  const t = useTranslations("parentSetup");
  const [s, setS] = useState<WizardState>(props.initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [late, setLate] = useState(false);
  const total = PARENT_SETUP_STEPS.length;
  const stepName = PARENT_SETUP_STEPS[s.step];
  const { childName, firstName } = props;

  // Reading aloud speaks in the chosen companion's voice (male / female).
  const chosenVoice = props.companions.find((c) => c.id === s.companionId)?.voice ?? null;
  useEffect(() => setCompanionVoice(chosenVoice), [chosenVoice]);

  // Handoff 7.4: a soft limit, not a wall.
  useEffect(() => {
    const started = s.startedAt ? new Date(s.startedAt).getTime() : Date.now();
    const check = () => setLate(Date.now() - started > SOFT_LIMIT_MINUTES * 60000);
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [s.startedAt]);

  /** Move to a step and save everything so far (save-and-resume). */
  function go(next: WizardState) {
    setError(null);
    setS(next);
    window.scrollTo({ top: 0 });
    start(async () => {
      const { startedAt: _ignored, ...data } = next;
      void _ignored;
      // Saving for later is a convenience: if it fails, her setup simply carries on.
      await saveParentDraftAction(next.step, { ...data, layout: PARENT_SETUP_LAYOUT }).catch(() => undefined);
      if (!next.startedAt) setS((cur) => ({ ...cur, startedAt: new Date().toISOString() }));
    });
  }
  const idx = (name: (typeof PARENT_SETUP_STEPS)[number]) => PARENT_SETUP_STEPS.indexOf(name);
  const back = () => {
    let prev = s.step - 1;
    if (PARENT_SETUP_STEPS[prev] === "followups" && s.followUps.length === 0) prev -= 1;
    go({ ...s, step: Math.max(0, prev) });
  };

  const agreed = byTime(s.items.filter((i) => i.consent));
  const setItem = (n: number, patch: Partial<ParentItem>) => setS((cur) => ({ ...cur, items: cur.items.map((it, j) => (j === n ? { ...it, ...patch } : it)) }));

  function understand() {
    const text = s.usingParts ? [s.parts.morning, s.parts.afternoon, s.parts.evening].filter((x) => x.trim()).join(". ") : s.transcript;
    if (!text.trim()) {
      setError(t("day.empty"));
      return;
    }
    start(async () => {
      const r = await understandDayAction(text);
      if (!r.ok) {
        setError(r.reason === "empty" ? t("day.empty") : t("error"));
        return;
      }
      // Nothing is pre-ticked (G1): she says yes item by item on the one list.
      const items = byTime(r.items.map((i) => ({ ...i, included: true, consent: false })));
      go({ ...s, items, followUps: r.followUps, followUpIndex: 0, step: r.followUps.length > 0 ? idx("followups") : idx("checklist") });
    });
  }

  function answerFollowUp(add: boolean) {
    const q = s.followUps[s.followUpIndex];
    const items = add && q ? byTime([...s.items, { ...q, included: true, consent: false, share: true }]) : s.items;
    const last = s.followUpIndex + 1 >= s.followUps.length;
    go({ ...s, items, followUpIndex: s.followUpIndex + 1, step: last ? idx("checklist") : s.step });
  }

  function finish() {
    if (!accepted) {
      setError(t("terms.required"));
      return;
    }
    start(async () => {
      const r = await finishParentSetupAction({
        companionId: s.companionId,
        items: s.items.map((i) => ({ ...i, included: true })),
        summaryToChild: s.summaryToChild,
        gapAMinutes: s.gapA,
        gapBMinutes: s.gapB,
        termsAccepted: accepted,
      });
      if (r && !r.ok) setError(t("error"));
    });
  }

  const nextButton = (onClick: () => void, disabled = false, label = t("next")) => (
    <button type="button" className={`${buttonStyles.primary} ${big}`} disabled={pending || disabled} onClick={onClick}>
      {pending ? t("saving") : label}
    </button>
  );

  // Her check-ins are chosen in ONE place (the list step); later steps only show them, with a big
  // Edit button that takes her back to that list (P-028).
  const summary = (
    <div className="rounded-2xl bg-white p-4 shadow-sm" data-testid="checklist-summary">
      <h3 className="text-xl font-semibold">{t("checklist.summaryTitle")}</h3>
      {agreed.length === 0 ? (
        <p className="mt-1 text-lg">{t("checklist.none")}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {agreed.map((it, n) => (
            <li key={n} className="text-lg" data-testid="summary-item">
              <span className="font-semibold">{it.label}</span>
              <span className="text-[#54656f]">
                {" · "}
                {it.localTime ?? t("checklist.noTime")}
                {" · "}
                {it.share && s.summaryToChild ? t("checklist.shared", { childName }) : t("checklist.notShared")}
              </span>
            </li>
          ))}
        </ul>
      )}
      {s.items.length > agreed.length && <p className="mt-2 text-base text-[#54656f]">{t("checklist.notChecked", { n: s.items.length - agreed.length })}</p>}
      <button
        type="button"
        className={`${buttonStyles.secondary} ${big} mt-3 border-2 border-[#008069] font-semibold text-[#008069]`}
        disabled={pending}
        onClick={() => go({ ...s, step: idx("checklist") })}
        data-testid="checklist-edit"
      >
        {t("checklist.edit")}
      </button>
    </div>
  );

  return (
    <section className="flex flex-col gap-5 bg-[#EFEAE2] p-4 pb-8" data-testid={`parent-setup-${stepName}`}>
      <div>
        <p className="text-base text-[#54656f]" data-testid="parent-setup-progress">
          {t("progress", { n: s.step + 1, total })}
        </p>
        <div className="mt-1 h-2 rounded-full bg-white">
          <div className="h-2 rounded-full bg-[#00a884]" style={{ width: `${((s.step + 1) / total) * 100}%` }} />
        </div>
      </div>
      {late && <p className="rounded-xl bg-amber-50 p-3 text-lg text-amber-900">{t("later")}</p>}

      {stepName === "companion" && (
        <>
          <h2 className="text-2xl font-semibold">{t("companion.title")}</h2>
          <Says text={t("companion.intro")} />
          <div role="radiogroup" aria-label={t("companion.title")} className="grid grid-cols-2 gap-3">
            {props.companions.map((c) => {
              const on = s.companionId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setS({ ...s, companionId: c.id })}
                  className={`flex flex-col items-center rounded-2xl bg-white p-3 text-center shadow-sm ${on ? "ring-4 ring-[#008069]" : ""}`}
                >
                  <AvatarCircle src={c.image} alt="" size={88} />
                  <span className="mt-2 text-lg font-semibold">{c.name}</span>
                  <span className="text-sm text-[#54656f]">{c.style}</span>
                  {on && <span className="mt-1 text-base font-semibold text-[#008069]">{t("companion.chosen")}</span>}
                </button>
              );
            })}
          </div>
          {nextButton(() => go({ ...s, step: idx("day") }), !s.companionId)}
        </>
      )}

      {stepName === "day" && (
        <>
          <h2 className="text-2xl font-semibold">{t("day.title")}</h2>
          <Says text={t("day.question", { firstName })} />
          <p className="text-lg text-[#54656f]">{t("day.hint")}</p>
          {s.usingParts ? (
            (["morning", "afternoon", "evening"] as const).map((part) => (
              <label key={part} className="flex flex-col gap-1 text-lg font-medium">
                {t(`day.${part}`)}
                <textarea className={box} rows={3} value={s.parts[part]} onChange={(e) => setS({ ...s, parts: { ...s.parts, [part]: e.target.value } })} />
                <PushToTalk onText={(x) => setS((cur) => ({ ...cur, parts: { ...cur.parts, [part]: `${cur.parts[part]} ${x}`.trim() } }))} />
              </label>
            ))
          ) : (
            <>
              <PushToTalk onText={(x) => setS((cur) => ({ ...cur, transcript: `${cur.transcript} ${x}`.trim() }))} />
              <label className="flex flex-col gap-1 text-lg font-medium">
                {t("day.label")}
                <textarea className={box} rows={6} value={s.transcript} onChange={(e) => setS({ ...s, transcript: e.target.value })} />
              </label>
            </>
          )}
          <button type="button" className="min-h-12 text-left text-lg font-medium text-[#01699a] underline" onClick={() => setS({ ...s, usingParts: !s.usingParts })}>
            {s.usingParts ? t("day.oneQuestion") : t("day.parts")}
          </button>
          {pending && <p className="text-lg text-[#54656f]">{t("day.thinking")}</p>}
          {nextButton(understand)}
          {/* P-040: if speaking does not work (or she would rather not), she makes the list herself. */}
          <button
            type="button"
            className={`${buttonStyles.secondary} ${big}`}
            disabled={pending}
            onClick={() => go({ ...s, followUps: [], followUpIndex: 0, step: idx("checklist") })}
            data-testid="day-skip"
          >
            {t("day.skip")}
          </button>
        </>
      )}

      {stepName === "followups" && s.followUps[s.followUpIndex] && (
        <>
          <h2 className="text-2xl font-semibold">{t("followups.title")}</h2>
          <p className="text-lg">{t("followups.intro", { childName })}</p>
          <p className="text-base text-[#54656f]">{t("followups.count", { n: s.followUpIndex + 1, total: s.followUps.length })}</p>
          <Says
            text={t("followups.question", {
              childName,
              label: s.followUps[s.followUpIndex].label,
              time: s.followUps[s.followUpIndex].localTime ?? "none",
            })}
          />
          <div className="flex gap-3">
            <button type="button" className={`${buttonStyles.primary} ${big} flex-1`} disabled={pending} onClick={() => answerFollowUp(true)}>
              {t("followups.yes")}
            </button>
            <button type="button" className={`${buttonStyles.secondary} ${big} flex-1`} disabled={pending} onClick={() => answerFollowUp(false)}>
              {t("followups.no")}
            </button>
          </div>
        </>
      )}

      {stepName === "checklist" && (
        <>
          <h2 className="text-2xl font-semibold">{t("checklist.title")}</h2>
          <Says text={t("checklist.say")} />
          <p className="text-lg">{t("checklist.intro")}</p>
          <ul className="flex flex-col gap-3" data-testid="parent-checklist">
            {s.items.map((it, n) => (
              <li key={n} className="rounded-xl bg-white p-3 shadow-sm" data-testid="consent-item">
                <p className="text-lg font-semibold">{it.label}</p>
                <label className="mt-2 flex items-center gap-3 text-lg">
                  <span className="w-16 shrink-0">{t("checklist.time")}</span>
                  <select
                    className={`${box} min-h-12 py-2`}
                    value={it.localTime ?? ""}
                    onChange={(e) => setItem(n, { localTime: e.target.value || null })}
                    aria-label={t("checklist.timeFor", { label: it.label })}
                    data-testid="consent-time"
                  >
                    <option value="">{t("checklist.noTime")}</option>
                    {timeChoices(it.localTime).map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-1 flex min-h-12 items-center gap-3 text-lg">
                  <input type="checkbox" className="h-7 w-7 shrink-0 accent-[#008069]" checked={it.consent} onChange={(e) => setItem(n, { consent: e.target.checked })} />
                  {t("checklist.yes")}
                </label>
                <label className={`flex min-h-12 items-center gap-3 text-lg ${it.consent ? "" : "opacity-50"}`}>
                  <input type="checkbox" className="h-7 w-7 shrink-0 accent-[#008069]" disabled={!it.consent} checked={it.consent && it.share} onChange={(e) => setItem(n, { share: e.target.checked })} />
                  {t("checklist.share", { childName })}
                </label>
              </li>
            ))}
          </ul>
          {s.items.length === 0 && <p className="text-lg">{t("checklist.empty")}</p>}
          <AddCheckin onAdd={(item) => setS((cur) => ({ ...cur, items: [...cur.items, { ...item, included: true, consent: true, share: true }] }))} />
          {agreed.length === 0 && <p className="text-lg text-[#54656f]">{t("checklist.none")}</p>}
          {nextButton(() => go({ ...s, items: byTime(s.items), step: idx("thanks") }))}
        </>
      )}

      {stepName === "thanks" && (
        <>
          <h2 className="text-2xl font-semibold">{t("thanks.title")}</h2>
          <Says text={t("thanks.note")} />
          <label className="flex min-h-14 items-center gap-3 rounded-xl bg-white p-3 text-lg shadow-sm">
            <input type="checkbox" className="h-7 w-7 shrink-0 accent-[#008069]" checked={s.summaryToChild} onChange={(e) => setS({ ...s, summaryToChild: e.target.checked })} />
            {t("thanks.summary", { childName })}
          </label>
          <p className="text-base text-[#54656f]">{t("thanks.summaryHint")}</p>
          {summary}
          {nextButton(() => go({ ...s, step: idx("alarms") }))}
        </>
      )}

      {stepName === "alarms" && (
        <>
          <h2 className="text-2xl font-semibold">{t("alarms.title")}</h2>
          <p className="text-lg">{t("alarms.intro", { childName })}</p>
          {(["gapA", "gapB"] as const).map((k) => (
            <label key={k} className="flex flex-col gap-1 text-lg font-medium">
              {k === "gapA" ? t("alarms.gapA") : t("alarms.gapB", { childName })}
              <select className={box} value={s[k]} onChange={(e) => setS({ ...s, [k]: Number(e.target.value) })}>
                {GAP_CHOICES.map((n) => (
                  <option key={n} value={n}>
                    {t("alarms.minutes", { n })}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <Says text={t("alarms.explain", { a: s.gapA, b: s.gapB, childName })} />
          {/* Without notifications her phone hears nothing while the app is closed (team test, P-029). */}
          <h3 className="text-xl font-semibold">{t("alarms.notifyTitle")}</h3>
          <p className="text-lg">{t("alarms.notify")}</p>
          <div className="rounded-2xl bg-white">{props.notifications}</div>
          {nextButton(() => go({ ...s, gapA: nearestGap(s.gapA), gapB: nearestGap(s.gapB), step: idx("terms") }))}
        </>
      )}

      {stepName === "terms" && (
        <>
          <h2 className="text-2xl font-semibold">{t("terms.title")}</h2>
          {summary}
          <div className="rounded-2xl bg-white p-4 text-lg shadow-sm">{props.terms}</div>
          <label className="flex min-h-14 items-center gap-3 rounded-xl border-2 border-[#008069] bg-white p-3 text-lg font-medium">
            <input type="checkbox" className="h-7 w-7 shrink-0 accent-[#008069]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            {t("terms.accept")}
          </label>
          {nextButton(finish, false, t("terms.finish"))}
        </>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-lg text-red-800">
          {error}
        </p>
      )}
      {s.step > 0 && (
        <button type="button" className={`${buttonStyles.secondary} ${big}`} disabled={pending} onClick={back}>
          {t("back")}
        </button>
      )}
    </section>
  );
}
