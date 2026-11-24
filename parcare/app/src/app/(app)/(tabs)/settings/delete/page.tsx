import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { deleteFamilyDataAction } from "@/app/(app)/(tabs)/settings/actions";
import { SubPageHeader } from "@/components/settings/SubPageHeader";
import { ButtonLink } from "@/components/ui/Screen";
import { isDemoMode } from "@/config/env";
import { requireChild } from "@/data/access";

// "Delete all our data" (G14: deletion on request; G15: voice clips too).
export default async function DeleteDataPage() {
  const t = await getTranslations("deleteData");
  return (
    <div className="flex flex-col">
      <SubPageHeader title={t("title")} backLabel={t("back")} />
      <Suspense fallback={null}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const t = await getTranslations("deleteData");
  const { parent } = await requireChild();
  const parentPetName = parent?.petName ?? "";
  return (
    <form action={deleteFamilyDataAction} className="flex flex-col gap-4 p-4">
      <p className="text-base">{t("intro")}</p>
      <ul className="flex list-disc flex-col gap-1 pl-6 text-base">
        {(["p1", "p2", "p3", "p4"] as const).map((k) => (
          <li key={k}>{t(`list.${k}`, { parentPetName })}</li>
        ))}
      </ul>
      <p className="text-base">{t("keepLogin")}</p>
      {isDemoMode() && <p className="text-sm text-[#54656f]">{t("demoNote")}</p>}
      <label className="flex min-h-12 items-center gap-3 rounded-xl border-2 border-[#b42318] p-3 text-base font-medium">
        <input type="checkbox" name="confirm" required className="h-6 w-6 accent-[#b42318]" />
        {t("confirm")}
      </label>
      <button type="submit" className="flex min-h-12 w-full items-center justify-center rounded-full bg-[#b42318] px-6 text-base font-semibold text-white hover:bg-[#912018]">
        {t("button")}
      </button>
      <ButtonLink href="/settings" variant="secondary">
        {t("cancel")}
      </ButtonLink>
    </form>
  );
}
