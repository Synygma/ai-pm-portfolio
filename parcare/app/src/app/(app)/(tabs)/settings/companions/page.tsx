import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { SubPageHeader } from "@/components/settings/SubPageHeader";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { getAvatar, MY_CHILD_AVATAR_ID, selectableCompanions } from "@/config/brand";
import { requireChild } from "@/data/access";

// Companion gallery (5.10): read-only. The parent chooses in their app; "My Child" is never a
// companion (it only marks the child's own voice reminders).
export default async function CompanionsPage() {
  const t = await getTranslations("settingsCompanions");
  return (
    <div className="flex flex-col">
      <SubPageHeader title={t("title")} backLabel={t("back")} />
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    </div>
  );
}

async function Gallery() {
  const t = await getTranslations("settingsCompanions");
  const ta = await getTranslations("avatar");
  const { household, parent } = await requireChild();
  const parentPetName = parent?.petName ?? "";
  const chosenId = household?.parentAvatarId ?? null;
  const chosen = chosenId ? getAvatar(chosenId) : null;
  const myChild = getAvatar(MY_CHILD_AVATAR_ID);
  return (
    <div className="flex flex-col gap-5 p-4">
      <p className="text-base">{t("intro", { parentPetName })}</p>
      <p className="rounded-lg bg-[#f0f2f5] px-3 py-2 text-sm">{t("aiNote")}</p>
      <ul className="grid grid-cols-3 gap-x-2 gap-y-4" data-testid="companion-grid">
        {selectableCompanions.map((a) => {
          const isChosen = a.id === chosenId;
          return (
            <li
              key={a.id}
              className={`flex flex-col items-center rounded-xl p-1 text-center ${isChosen ? "bg-[#e7f5f1] ring-2 ring-[#008069]" : ""}`}
              data-testid={isChosen ? "companion-chosen" : undefined}
            >
              <AvatarCircle src={a.image} alt={ta("photoOf", { name: a.name })} size={72} />
              <span className="mt-1 text-sm font-semibold leading-tight">{a.name}</span>
              <span className="text-xs leading-snug text-[#54656f]">{a.style}</span>
              {isChosen && <span className="mt-1 text-xs font-semibold text-[#008069]">{t("chosen", { parentPetName })}</span>}
            </li>
          );
        })}
      </ul>
      <section className="flex items-center gap-3 rounded-xl border border-[#e9edef] p-3" data-testid="my-child-note">
        <AvatarCircle src={myChild.image} alt={ta("photoOf", { name: myChild.name })} size={56} />
        <div>
          <h3 className="text-base font-semibold">
            {myChild.name}: {t("myChildTitle")}
          </h3>
          <p className="text-sm text-[#54656f]">{t("myChildNote")}</p>
        </div>
      </section>
      {chosen && (
        <section className="flex items-center gap-3 rounded-xl border border-[#e9edef] p-3">
          <AvatarCircle src={chosen.image} alt="" size={56} helper helperLabel={ta("helperBadge")} />
          <div>
            <h3 className="text-base font-semibold">{t("helperTitle")}</h3>
            <p className="text-sm text-[#54656f]">{t("helperNote", { parentPetName })}</p>
          </div>
        </section>
      )}
    </div>
  );
}
