import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ParentHeader } from "@/components/parent/ParentHeader";
import { ParentSetupWizard, type WizardState } from "@/components/parent/ParentSetupWizard";
import { PushToggle } from "@/components/settings/PushToggle";
import { TermsContent } from "@/components/terms/TermsContent";
import { selectableCompanions } from "@/config/brand";
import { requireParent } from "@/data/parent-access";
import { asOneList, nearestGap, PARENT_SETUP_LAYOUT, PARENT_SETUP_STEPS, stepFromOldLayout } from "@/domain/parent-setup";
import { getParentDraft } from "@/services/parent-setup";
import { removeParentPushAction, saveParentPushAction } from "../settings/actions";

// The parent's own setup (handoff 7.1 A–F + terms), saved after every step.
export default async function ParentSetupPage() {
  const t = await getTranslations("parentSetup");
  return (
    <div className="flex flex-1 flex-col">
      <ParentHeader companion={null} title={t("title")} />
      <Suspense fallback={null}>
        <Wizard />
      </Suspense>
    </div>
  );
}

async function Wizard() {
  const me = await requireParent();
  if (me.parent.setupCompletedAt) redirect("/p");
  const draft = await getParentDraft(me.repos, me.household.id);
  const saved = (draft?.data ?? {}) as Partial<WizardState>;
  const savedStep = draft?.step ?? 0;
  const initial: WizardState = {
    layout: PARENT_SETUP_LAYOUT,
    step: Math.min(PARENT_SETUP_STEPS.length - 1, saved.layout === PARENT_SETUP_LAYOUT ? savedStep : stepFromOldLayout(savedStep)),
    companionId: saved.companionId ?? me.household.parentAvatarId ?? "",
    transcript: saved.transcript ?? "",
    parts: saved.parts ?? { morning: "", afternoon: "", evening: "" },
    usingParts: saved.usingParts ?? false,
    items: asOneList(saved.items ?? []),
    followUps: saved.followUps ?? [],
    followUpIndex: saved.followUpIndex ?? 0,
    summaryToChild: saved.summaryToChild ?? true,
    gapA: nearestGap(saved.gapA ?? me.household.gapAMinutes),
    gapB: nearestGap(saved.gapB ?? me.household.gapBMinutes),
    startedAt: typeof draft?.data.startedAt === "string" ? draft.data.startedAt : null,
  };
  return (
    <ParentSetupWizard
      initial={initial}
      firstName={me.firstName}
      childName={me.childName}
      companions={selectableCompanions.map((a) => ({ id: a.id, name: a.name, style: a.style, image: a.image, voice: a.voice }))}
      terms={<TermsContent />}
      notifications={
        <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} save={saveParentPushAction} remove={removeParentPushAction} namespace="parentApp.push" />
      }
    />
  );
}
