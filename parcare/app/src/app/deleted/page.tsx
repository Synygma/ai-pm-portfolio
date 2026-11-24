import { getTranslations } from "next-intl/server";
import { ButtonLink, Screen } from "@/components/ui/Screen";

// Shown after "Delete all our data".
export default async function DeletedPage() {
  const t = await getTranslations("deleteData");
  return (
    <Screen>
      <h1 className="text-center text-xl font-semibold" role="status">
        {t("done")}
      </h1>
      <div className="mt-4 w-full">
        <ButtonLink href="/">{t("home")}</ButtonLink>
      </div>
    </Screen>
  );
}
