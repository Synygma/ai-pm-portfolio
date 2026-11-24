import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PasteLinkForm } from "@/components/parent/PasteLinkForm";
import { ButtonLink, Screen } from "@/components/ui/Screen";
import { getCurrentParent } from "@/data/parent-access";

// "I am the parent" on the entry screen. A parent signed in on this phone goes to her app;
// anyone else is told to open the link their child sent (there is no parent password).
export default async function ParentPage() {
  const t = await getTranslations("parentApp.noSession");
  return (
    <Screen>
      <Suspense fallback={null}>
        <SignedInGoesHome />
      </Suspense>
      <h1 className="text-center text-xl font-semibold">{t("title")}</h1>
      <p className="text-center text-lg text-neutral-700">{t("body")}</p>
      <PasteLinkForm />
      <div className="mt-4 w-full">
        <ButtonLink href="/" variant="secondary">
          {t("back")}
        </ButtonLink>
      </div>
    </Screen>
  );
}

async function SignedInGoesHome() {
  if (await getCurrentParent()) redirect("/p");
  return null;
}
