"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SETUP_STEPS } from "@/domain/setup";
import type { SetupState } from "@/services/setup";
import {
  CallStep,
  ChildStep,
  DayStep,
  EmergencyStep,
  HowItWorksStep,
  IntroduceStep,
  InviteStep,
  ParentStep,
  type StepProps,
  TermsStep,
} from "./steps";
import { SaveLaterContext } from "./ui";

const STEP_COMPONENTS: Record<(typeof SETUP_STEPS)[number], (p: StepProps) => React.ReactNode> = {
  child: ChildStep,
  parent: ParentStep,
  howItWorks: HowItWorksStep,
  introduce: IntroduceStep,
  day: DayStep,
  emergency: EmergencyStep,
  invite: InviteStep,
  call: CallStep,
  terms: TermsStep,
};

// Setup wizard (5.2): progress bar, one step at a time, saved after every step so it resumes
// where the child left off.
export function SetupWizard({ initial, aiMode }: { initial: SetupState; aiMode: "mock" | "gemini" }) {
  const t = useTranslations("setup");
  const [state, setState] = useState(initial);
  const [index, setIndex] = useState(Math.min(initial.completed, SETUP_STEPS.length - 1));
  const total = SETUP_STEPS.length;
  const step = SETUP_STEPS[index];
  const Step = STEP_COMPONENTS[step];
  const router = useRouter();

  function goTo(i: number) {
    setIndex(i);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="flex flex-col">
      <div className="sticky top-14 z-10 bg-white px-4 pb-3 pt-3 shadow-[0_1px_0_#e9edef]">
        <p className="text-sm text-[#54656f]" data-testid="setup-progress">
          {t("progress", { current: index + 1, total })}
        </p>
        <div
          className="mt-1 h-2 overflow-hidden rounded-full bg-[#e9edef]"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          aria-label={t("progress", { current: index + 1, total })}
        >
          <div className="h-full rounded-full bg-[#00a884] transition-all" style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
      </div>
      <SaveLaterContext value={() => router.push("/setup/paused")}>
      <div className="px-4 py-5" data-testid={`setup-step-${step}`}>
        <Step
          key={step}
          state={state}
          aiMode={aiMode}
          update={(patch) => setState((s) => ({ ...s, ...patch, completed: Math.max(s.completed, index + 1) }))}
          onDone={() => {
            setState((s) => ({ ...s, completed: Math.max(s.completed, index + 1) }));
            goTo(Math.min(index + 1, total - 1));
          }}
          onBack={index > 0 ? () => goTo(index - 1) : undefined}
        />
      </div>
      </SaveLaterContext>
    </div>
  );
}
