import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ParentHeader } from "@/components/parent/ParentHeader";
import { ReadAloudButton } from "@/components/parent/ReadAloud";
import { requireParent } from "@/data/parent-access";

// SOS (handoff N9, G6, G8): tells the parent to contact local help and shows the emergency
// contact the family added. It never places a call and shows no scraped numbers.
export default async function SosPage() {
  const t = await getTranslations("parentApp.sos");
  return (
    <div className="flex flex-1 flex-col">
      <ParentHeader companion={null} title={t("title")} />
      <Suspense fallback={null}>
        <Body />
      </Suspense>
    </div>
  );
}

async function Body() {
  const t = await getTranslations("parentApp.sos");
  const me = await requireParent();
  const contact = (await me.repos.emergencyContacts.find({ householdId: me.household.id }))[0] ?? null;
  const say = `${t("body")} ${t("cannot")}`;
  return (
    <section className="flex flex-col gap-4 p-4" data-testid="sos-page">
      <div className="rounded-2xl bg-[#fef3f2] p-5 text-[#7a271a]">
        <p className="text-2xl font-bold leading-snug">{t("body")}</p>
        <p className="mt-2 text-lg">{t("cannot")}</p>
        <ReadAloudButton text={say} />
      </div>
      <div className="rounded-2xl border border-[#e9edef] p-5" data-testid="sos-contact">
        <h2 className="text-lg font-semibold">{t("contactTitle")}</h2>
        {contact ? (
          <>
            <p className="mt-1 text-2xl font-semibold">{contact.name}</p>
            <p className="text-2xl tracking-wide">{contact.phone}</p>
          </>
        ) : (
          <p className="mt-1 text-lg">{t("contactNone", { childName: me.childName })}</p>
        )}
      </div>
      <Link href="/p" className="flex min-h-14 items-center justify-center rounded-full border-2 border-[#008069] text-lg font-semibold text-[#008069]">
        {t("back")}
      </Link>
    </section>
  );
}
