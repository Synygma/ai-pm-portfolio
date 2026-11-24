import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getSessionUser } from "@/auth";
import { ButtonLink, Screen } from "@/components/ui/Screen";
import { brand } from "@/config/brand";
import { getCurrentParent } from "@/data/parent-access";

// Entry screen (5.1): who is using the app?
export default async function EntryPage() {
  const t = await getTranslations("entry");
  return (
    <Screen iconSize={128}>
      <h1 className="sr-only">{brand.appName}</h1>
      <p className="text-center text-lg text-neutral-700">{t("tagline")}</p>
      {/* The choice appears only once we know who is signed in here (no flash before the redirect). */}
      <Suspense fallback={<div className="mt-6 min-h-32 w-full" />}>
        <ChoiceUnlessSignedIn child={t("child")} parent={t("parent")} />
      </Suspense>
      <Link href="/terms" className="mt-4 inline-flex min-h-12 items-center text-base font-medium text-[#008069] underline">
        {t("termsLink")}
      </Link>
    </Screen>
  );
}

/**
 * The home-screen icon opens this page. Someone already signed in on this phone goes straight to
 * their app (P-038: it looked like being asked to log in again after closing the app). A phone
 * signed in as both child and parent keeps the choice; each button then goes straight in.
 */
async function ChoiceUnlessSignedIn({ child: childLabel, parent: parentLabel }: { child: string; parent: string }) {
  const [child, parent] = await Promise.all([getSessionUser().catch(() => null), getCurrentParent().catch(() => null)]);
  if (child && !parent) redirect("/home");
  if (parent && !child) redirect("/p");
  return (
    <div className="mt-6 flex w-full flex-col gap-3">
      <ButtonLink href="/login">{childLabel}</ButtonLink>
      <ButtonLink href="/parent" variant="secondary">
        {parentLabel}
      </ButtonLink>
    </div>
  );
}
