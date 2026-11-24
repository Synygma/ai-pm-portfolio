"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { digestFeedbackAction } from "@/app/(app)/(tabs)/digest/actions";

type Verdict = "matched" | "not_matched" | "skipped";

// "Matched what my parent told me" / "Did not match" (5.7), or "Skip". Stored; can be changed.
export function DigestFeedback({ digestId, initial, parentPetName }: { digestId: string; initial: Verdict | null; parentPetName: string }) {
  const t = useTranslations("digest.feedback");
  const [verdict, setVerdict] = useState<Verdict | null>(initial);
  const [pending, start] = useTransition();

  function choose(v: Verdict) {
    start(async () => {
      const r = await digestFeedbackAction(digestId, v);
      if (r.ok) setVerdict(v);
    });
  }

  const base = "flex min-h-12 flex-1 items-center justify-center rounded-full border-2 px-3 text-base font-semibold";
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm" aria-labelledby="feedback-q">
      <h2 id="feedback-q" className="text-base font-semibold">
        {t("question", { parentPetName })}
      </h2>
      <div className="mt-3 flex flex-col gap-2">
        {(["matched", "not_matched", "skipped"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={verdict === v}
            disabled={pending}
            onClick={() => choose(v)}
            className={`${base} ${verdict === v ? "border-[#008069] bg-[#008069] text-white" : v === "skipped" ? "border-[#c8cdd0] bg-white text-[#54656f]" : "border-[#008069] bg-white text-[#008069]"}`}
          >
            {t(v)}
          </button>
        ))}
      </div>
      {verdict && (
        <p role="status" className="mt-2 text-sm text-[#54656f]" data-testid="feedback-saved">
          {t("saved")}
        </p>
      )}
    </section>
  );
}
