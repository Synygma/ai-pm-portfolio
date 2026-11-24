import { getTranslations } from "next-intl/server";
import { SignupForm } from "@/components/auth/AuthForms";
import { Screen } from "@/components/ui/Screen";

export default async function SignupPage() {
  const t = await getTranslations("signup");
  return (
    <Screen iconSize={72}>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <SignupForm />
    </Screen>
  );
}
