import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { HelpForm } from "@/components/parent/HelpForm";
import { ParentHeader } from "@/components/parent/ParentHeader";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { requireParent } from "@/data/parent-access";
import { localTime } from "@/domain/time";

// "Ask for help" (handoff 7.7, N11): her non-urgent requests go to the child's Helper list.
// Not for emergencies (SOS is always at the bottom). ParCare books nothing.
export default async function ParentHelpPage() {
  const t = await getTranslations("parentApp.help");
  return (
    <div className="flex flex-1 flex-col bg-[#EFEAE2]">
      <ParentHeader companion={null} title={t("title")} />
      <Suspense fallback={null}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const t = await getTranslations("parentApp.help");
  const ta = await getTranslations("avatar");
  const me = await requireParent();
  const requests = (await me.repos.helperRequests.find({ householdId: me.household.id }, { orderBy: "createdAt", desc: true })).slice(0, 10);
  const { childName } = me;
  return (
    <section className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        {me.companion && <AvatarCircle src={me.companion.image} alt="" size={64} helper helperLabel={ta("helperBadge")} />}
        <p className="text-lg">{t("intro", { childName })}</p>
      </div>
      <p className="rounded-xl bg-amber-50 p-3 text-lg font-medium text-amber-900">{t("notEmergency")}</p>
      <HelpForm childName={childName} />
      <div>
        <h2 className="mb-2 text-lg font-semibold">{t("listTitle")}</h2>
        {requests.length === 0 ? (
          <p className="text-lg text-[#54656f]">{t("none")}</p>
        ) : (
          <ul className="flex flex-col gap-2" data-testid="my-requests">
            {requests.map((r) => (
              <li key={r.id} className="rounded-xl bg-white p-3 shadow-sm" data-testid="my-request">
                <p className="text-lg">{r.text ? `“${r.text}”` : t("voiceOnly")}</p>
                <p className="text-base text-[#54656f]">
                  {localTime(new Date(r.createdAt), me.parent.timeZone)} · <span data-testid="my-request-status">{t(`status.${r.status}`, { childName })}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
