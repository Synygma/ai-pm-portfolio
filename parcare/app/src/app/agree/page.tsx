import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { TermsContent } from "@/components/terms/TermsContent";
import { Screen } from "@/components/ui/Screen";
import { getCurrentChild } from "@/data/access";
import { AgreeForm } from "./AgreeForm";

// Shown once, before first use (after the first sign-in or sign-up, and again if the terms change).
export default async function AgreePage() {
  const t = await getTranslations("agree");
  return (
    <Screen iconSize={64}>
      <h1 className="text-center text-xl font-semibold">{t("title")}</h1>
      <p className="text-center text-base text-[#54656f]">{t("intro")}</p>
      <TermsContent />
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
    </Screen>
  );
}

async function Gate() {
  const child = await getCurrentChild();
  if (!child) redirect("/login");
  if (child.agreedTerms) redirect("/home");
  return <AgreeForm />;
}
