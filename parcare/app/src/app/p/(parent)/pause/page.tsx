import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ReadAloudButton } from "@/components/parent/ReadAloud";
import { requireParent } from "@/data/parent-access";

// G5: shown after an emergency word in her answer. Its own page, so nothing on the chat screen can
// replace it while she reads it. Tells her to contact local help; never calls anyone.
export default function PausePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#b42318]" />}>
      <Pause />
    </Suspense>
  );
}

async function Pause() {
  const t = await getTranslations("parentApp.pause");
  const me = await requireParent();
  const contact = (await me.repos.emergencyContacts.find({ householdId: me.household.id }))[0] ?? null;
  const say = `${t("title")}. ${t("body")} ${t("told", { childName: me.childName })} ${t("cannot")}`;
  return (
    <section role="alert" className="flex flex-1 flex-col gap-3 bg-[#b42318] p-5 text-white" data-testid="pause-panel">
      <p className="text-5xl font-bold">{t("title")}</p>
      <p className="text-2xl font-semibold leading-snug">{t("body")}</p>
      <p className="text-lg">{t("told", { childName: me.childName })}</p>
      <p className="text-lg">{t("cannot")}</p>
      {contact && (
        <p className="rounded-xl bg-white/15 p-3 text-xl">
          {t("contact")} <strong>{contact.name}</strong>, <span className="tracking-wide">{contact.phone}</span>
        </p>
      )}
      <div className="rounded-xl bg-white p-2 text-[#111b21]">
        <ReadAloudButton text={say} />
      </div>
      <Link href="/p" className="mt-2 flex min-h-14 items-center justify-center rounded-full bg-white text-lg font-semibold text-[#b42318]">
        {t("back")}
      </Link>
    </section>
  );
}
