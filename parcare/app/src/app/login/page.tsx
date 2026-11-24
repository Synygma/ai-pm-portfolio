import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getSessionUser } from "@/auth";
import { LoginForm } from "@/components/auth/AuthForms";
import { Screen } from "@/components/ui/Screen";
import { isDemoMode } from "@/config/env";

export default async function LoginPage() {
  const t = await getTranslations("login");
  const te = await getTranslations("entry");
  return (
    <Screen iconSize={72}>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      {/* The form appears only once we know nobody is signed in here (no flash before the redirect). */}
      <Suspense fallback={<div className="min-h-64 w-full" />}>
        <FormUnlessSignedIn demoMode={isDemoMode()} />
      </Suspense>
      <Link href="/terms" className="inline-flex min-h-12 items-center text-base font-medium text-[#008069] underline">
        {te("termsLink")}
      </Link>
    </Screen>
  );
}

/** Already signed in on this phone: straight to the chats (P-038). Signing out is in Settings. */
async function FormUnlessSignedIn({ demoMode }: { demoMode: boolean }) {
  if (await getSessionUser().catch(() => null)) redirect("/home");
  return <LoginForm demoMode={demoMode} />;
}
