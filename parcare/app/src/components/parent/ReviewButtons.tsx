"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { parentReviewDoneAction } from "@/app/p/(parent)/settings/actions";

// Her review question (+2 weeks, then every 3 months): "All is fine" or "Change my check-ins".
export function ReviewButtons({ promptId }: { promptId: string }) {
  const t = useTranslations("parentApp.chat");
  const router = useRouter();
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done) return <p className="mt-1 text-base text-[#54656f]">{t("reviewDone")}</p>;
  return (
    <div className="mt-1 flex flex-wrap gap-2" data-testid="review-buttons">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await parentReviewDoneAction(promptId);
            setDone(true);
            router.refresh();
          })
        }
        className="min-h-12 rounded-full bg-[#008069] px-4 text-base font-semibold text-white"
      >
        {t("reviewFine")}
      </button>
      <Link href="/p/settings" className="flex min-h-12 items-center rounded-full border-2 border-[#008069] px-4 text-base font-semibold text-[#008069]">
        {t("reviewChange")}
      </Link>
    </div>
  );
}
