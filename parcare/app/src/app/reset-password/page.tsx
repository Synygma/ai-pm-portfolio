import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { getPasswordRecoveryUser } from "@/auth";
import { NewPasswordForm } from "@/components/auth/AuthForms";
import { Screen } from "@/components/ui/Screen";

export default async function ResetPasswordPage() {
  const t = await getTranslations("resetPassword");
  return (
    <Screen iconSize={72}>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <Suspense fallback={null}>
        <Gate />
      </Suspense>
    </Screen>
  );
}

async function Gate() {
  const t = await getTranslations("resetPassword");
  const user = await getPasswordRecoveryUser();
  if (!user) {
    return (
      <div className="flex w-full flex-col gap-4">
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-base text-amber-900" data-testid="reset-link-expired">
          {t("expired")}
        </p>
        <Link href="/forgot" className="text-center text-base font-semibold text-[#008069] underline">
          {t("askAgain")}
        </Link>
      </div>
    );
  }
  return <NewPasswordForm email={user.email} />;
}
