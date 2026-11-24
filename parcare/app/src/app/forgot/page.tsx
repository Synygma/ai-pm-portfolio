import { getTranslations } from "next-intl/server";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { Screen } from "@/components/ui/Screen";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("forgot");
  return (
    <Screen iconSize={72}>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <ForgotPasswordForm />
    </Screen>
  );
}
