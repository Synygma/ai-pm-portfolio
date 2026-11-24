import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { isAdminConfigured, isAdminSignedIn } from "@/auth/admin";
import { AdminLoginForm } from "@/components/admin/AdminForms";
import { Screen } from "@/components/ui/Screen";

export default async function AdminLoginPage() {
  const t = await getTranslations("admin.login");
  return (
    <Screen iconSize={72}>
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <Suspense fallback={null}>
        <Body />
      </Suspense>
    </Screen>
  );
}

async function Body() {
  const t = await getTranslations("admin.login");
  if (await isAdminSignedIn()) redirect("/admin");
  if (!isAdminConfigured()) return <p className="text-base text-[#54656f]">{t("off")}</p>;
  return <AdminLoginForm />;
}
