"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  answerAction,
  answerReminderAction,
  askNextNowAction,
  changeCompanionAction,
  type DemoResult,
  helperRequestAction,
  letGoUnansweredAction,
  moveClockAction,
  resetDemoDataAction,
  setAllConsentsAction,
} from "@/app/(app)/demo/actions";
import { buttonStyles } from "@/components/ui/Screen";
import { selectableCompanions } from "@/config/brand";
import type { CheckinStatus } from "@/data/types";

export type DemoView = {
  ringingReminder: string | null;
  answerTarget: { label: string; parentTime: string } | null;
  childNow: string;
  parentNow: string;
  childCity: string;
  parentCity: string;
  parentPetName: string;
  offsetMinutes: number;
  gapA: number;
  gapB: number;
  activeConsents: number;
  metaItems: number;
  ringing: number;
  companionId: string | null;
  memoryMode: boolean;
  upcoming: { id: string; label: string; status: CheckinStatus; parentTime: string; childTime: string }[];
};

const input = "min-h-12 w-full rounded-lg border border-neutral-400 bg-white px-3 text-base";
const small = "min-h-12 rounded-full border-2 border-[#008069] bg-white px-4 text-base font-semibold text-[#008069] disabled:opacity-50";

function Card({ title, children, testId }: { title: string; children: React.ReactNode; testId?: string }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm" data-testid={testId}>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function DemoTools({ view }: { view: DemoView | null }) {
  const t = useTranslations("demo");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [helper, setHelper] = useState("");
  const [companion, setCompanion] = useState(view?.companionId ?? "vidya");

  function run(action: () => Promise<DemoResult>, okMessage?: string) {
    setNotice(null);
    start(async () => {
      const r = await action();
      if (!r.ok) {
        setNotice(t(`errors.${r.reason}`));
        return;
      }
      if (r.alarm) {
        router.push("/alarm");
        return;
      }
      if (okMessage) setNotice(okMessage);
      router.refresh();
    });
  }

  if (!view) return <p className="p-4 text-base">{t("noHousehold")}</p>;

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("banner")}</p>
      <div>
        <a
          href="/api/demo/open-parent"
          target="_blank"
          rel="noopener"
          className={`${buttonStyles.primary} min-h-12`}
          data-testid="open-parent-app"
        >
          {t("openParent")}
        </a>
        <p className="mt-1 text-sm text-[#54656f]">{t("openParentHint")}</p>
      </div>
      {notice && (
        <p role="status" className="rounded-lg bg-white px-3 py-2 text-base shadow-sm" data-testid="demo-notice">
          {notice}
        </p>
      )}

      <Card title={t("clockTitle")} testId="demo-clock">
        <dl className="grid grid-cols-2 gap-2 text-base">
          <div>
            <dt className="text-sm text-[#54656f]">{view.childCity}</dt>
            <dd className="font-semibold" data-testid="child-now">
              {view.childNow}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[#54656f]">{view.parentCity}</dt>
            <dd className="font-semibold" data-testid="parent-now">
              {view.parentNow}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-sm text-[#54656f]">{view.offsetMinutes === 0 ? t("realTime") : t("ahead", { minutes: view.offsetMinutes })}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["5m", "1h", "1d", "1w", "3mo"] as const).map((step) => (
            <button key={step} type="button" className={small} disabled={pending} onClick={() => run(() => moveClockAction(step))}>
              {t(`steps.${step}`)}
            </button>
          ))}
          <button type="button" className={small} disabled={pending} onClick={() => run(() => moveClockAction("reset"))}>
            {t("steps.reset")}
          </button>
        </div>
        <p className="mt-2 text-sm text-[#54656f]">{t("clockNote")}</p>
      </Card>

      <Card title={t("upcomingTitle", { parentPetName: view.parentPetName })} testId="demo-upcoming">
        <p className="mb-2 text-sm text-[#54656f]">{t("gaps", { gapA: view.gapA, gapB: view.gapB })}</p>
        {view.upcoming.length === 0 ? (
          <p className="text-base">{view.activeConsents === 0 ? t("noConsents") : t("noUpcoming")}</p>
        ) : (
          <ul className="divide-y divide-[#e9edef]">
            {view.upcoming.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2 text-base">
                <span>
                  <span className="font-medium">{c.label}</span>
                  <span className="block text-sm text-[#54656f]">{t("times", { parent: c.parentTime, child: c.childTime })}</span>
                </span>
                <span className="shrink-0 rounded-full bg-[#f0f2f5] px-2 py-0.5 text-sm">{t(`status.${c.status}`)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={t("parentTitle", { parentPetName: view.parentPetName })} testId="demo-parent">
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium" htmlFor="demo-answer">
            {t("answerLabel")}
          </label>
          <p className="text-sm text-[#54656f]" data-testid="answer-target">
            {view.answerTarget ? t("answerTarget", view.answerTarget) : t("answerNoTarget")}
          </p>
          <textarea id="demo-answer" rows={2} className={`${input} py-2`} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder={t("answerPlaceholder")} />
          <div className="flex gap-4 text-base">
            {(["yes", "no"] as const).map((o) => (
              <label key={o} className="flex min-h-12 items-center gap-2">
                <input type="radio" name="outcome" className="h-5 w-5 accent-[#008069]" checked={outcome === o} onChange={() => setOutcome(o)} />
                {t(`outcome.${o}`)}
              </label>
            ))}
          </div>
          <button type="button" className={buttonStyles.primary} disabled={pending} onClick={() => run(() => answerAction(answer, outcome), t("answered"))}>
            {t("answerButton")}
          </button>
        </div>

        <hr className="my-4 border-[#e9edef]" />
        <button type="button" className={`${buttonStyles.secondary} mb-3`} disabled={pending} onClick={() => run(askNextNowAction, t("askNowDone"))}>
          {t("askNow")}
        </button>
        <button type="button" className={buttonStyles.secondary} disabled={pending} onClick={() => run(letGoUnansweredAction)}>
          {t("unansweredButton")}
        </button>
        <p className="mt-1 text-sm text-[#54656f]">{t("unansweredNote", { gapA: view.gapA, gapB: view.gapB })}</p>

        <hr className="my-4 border-[#e9edef]" />
        <div className="flex flex-col gap-2">
          <label className="text-base font-medium" htmlFor="demo-helper">
            {t("helperLabel")}
          </label>
          <textarea id="demo-helper" rows={2} className={`${input} py-2`} value={helper} onChange={(e) => setHelper(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={small} onClick={() => setHelper(t("helperSampleNormal"))}>
              {t("helperFillNormal")}
            </button>
            <button type="button" className={small} onClick={() => setHelper(t("helperSampleEmergency"))}>
              {t("helperFillEmergency")}
            </button>
          </div>
          <button type="button" className={buttonStyles.primary} disabled={pending} onClick={() => run(() => helperRequestAction(helper), t("helperSent"))}>
            {t("helperButton")}
          </button>
        </div>

        <hr className="my-4 border-[#e9edef]" />
        <p className="mb-2 text-base" data-testid="demo-consents">
          {t("consents", { active: view.activeConsents, total: view.metaItems })}
        </p>
        <div className="flex flex-col gap-2">
          <button type="button" className={buttonStyles.secondary} disabled={pending || view.activeConsents === 0} onClick={() => run(() => setAllConsentsAction(false), t("switchedOff"))}>
            {t("allOffButton")}
          </button>
          <button
            type="button"
            className={buttonStyles.secondary}
            disabled={pending || view.activeConsents === view.metaItems}
            onClick={() => run(() => setAllConsentsAction(true), t("switchedOn"))}
          >
            {t("allOnButton")}
          </button>
        </div>

        <hr className="my-4 border-[#e9edef]" />
        <label className="text-base font-medium" htmlFor="demo-companion">
          {t("companionLabel")}
        </label>
        <div className="mt-2 flex gap-2">
          <select id="demo-companion" className={input} value={companion} onChange={(e) => setCompanion(e.target.value)}>
            {selectableCompanions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button type="button" className={small} disabled={pending} onClick={() => run(() => changeCompanionAction(companion), t("companionChanged"))}>
            {t("save")}
          </button>
        </div>
        <hr className="my-4 border-[#e9edef]" />
        <p className="text-base font-medium">{t("reminderTitle")}</p>
        <p className="mb-2 text-sm text-[#54656f]" data-testid="ringing-reminder">
          {view.ringingReminder !== null ? t("reminderRinging", { label: view.ringingReminder }) : t("reminderNone")}
        </p>
        <div className="flex gap-2">
          <button type="button" className={small} disabled={pending || view.ringingReminder === null} onClick={() => run(() => answerReminderAction("ok"), t("reminderOkDone"))}>
            {t("reminderOk")}
          </button>
          <button type="button" className={small} disabled={pending || view.ringingReminder === null} onClick={() => run(() => answerReminderAction("snooze"), t("reminderSnoozeDone"))}>
            {t("reminderSnooze")}
          </button>
        </div>
      </Card>

      {view.memoryMode && (
        <Card title={t("resetTitle")}>
          <p className="mb-2 text-sm text-[#54656f]">{t("resetNote")}</p>
          <button type="button" className={buttonStyles.secondary} disabled={pending} onClick={() => run(resetDemoDataAction, t("resetDone"))}>
            {t("resetButton")}
          </button>
        </Card>
      )}
    </div>
  );
}
