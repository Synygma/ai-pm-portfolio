import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { signOutAction } from "@/auth/actions";
import { buttonStyles } from "@/components/ui/Screen";
import { TopBar } from "@/components/wa/TopBar";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { INVITE_VALID_DAYS } from "@/domain/invite";
import { SETUP_STEPS } from "@/domain/setup";
import { getSetupState } from "@/services/setup";

// "Save and finish later": everything up to here is kept; logging in again continues setup here.
export default async function SetupPausedPage() {
  const t = await getTranslations("setup");
  const tc = await getTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title={t("title")} />
      <Suspense fallback={<p className="p-4 text-[#54656f]">{tc("loading")}</p>}>
        <Paused />
      </Suspense>
    </div>
  );
}

async function Paused() {
  const t = await getTranslations("setup.paused");
  const child = await requireChild();
  const state = await getSetupState(await getRepos(), child.userId);
  if (state.setupDone) redirect("/home");
  const total = SETUP_STEPS.length;
  const next = Math.min(state.completed + 1, total);
  const petName = state.parents[state.managedIndex]?.petName || t("yourParent");
  // The invite link is made at step 7; from then on the parent can open it at any time.
  const linkSent = state.completed >= SETUP_STEPS.indexOf("invite") + 1;
  return (
    <div className="flex flex-col gap-4 px-4 py-6" data-testid="setup-paused">
      <h2 className="text-xl font-semibold text-[#111b21]">{t("title")}</h2>
      <p className="text-base">{t("where", { step: next, total })}</p>
      <ul className="list-disc space-y-1 pl-5 text-base">
        <li>{t("kept")}</li>
        <li>{t("comeBack")}</li>
        {linkSent ? <li>{t("linkWorks", { petName, days: INVITE_VALID_DAYS })}</li> : <li>{t("noLinkYet", { petName })}</li>}
      </ul>
      <Link href="/setup" className={buttonStyles.primary}>
        {t("continue")}
      </Link>
      <form action={signOutAction}>
        <button type="submit" className={buttonStyles.secondary}>
          {t("logOut")}
        </button>
      </form>
    </div>
  );
}
