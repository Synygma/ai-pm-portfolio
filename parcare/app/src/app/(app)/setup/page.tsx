import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { aiMode } from "@/ai";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { TopBar } from "@/components/wa/TopBar";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";
import { getSetupState } from "@/services/setup";

// Setup wizard page. Resumes at the first unfinished step; sends finished users home.
export default async function SetupPage() {
  const t = await getTranslations("setup");
  const tc = await getTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar title={t("title")} />
      <Suspense fallback={<p className="p-4 text-[#54656f]">{tc("loading")}</p>}>
        <Wizard />
      </Suspense>
    </div>
  );
}

async function Wizard() {
  const child = await requireChild();
  const state = await getSetupState(await getRepos(), child.userId);
  if (state.setupDone) redirect("/home");
  // Keyed by progress: a wizard kept from an earlier visit must restart from the saved state.
  return <SetupWizard key={`${state.householdId}-${state.completed}`} initial={state} aiMode={aiMode()} />;
}
