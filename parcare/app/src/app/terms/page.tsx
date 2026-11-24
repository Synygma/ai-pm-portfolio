import { getTranslations } from "next-intl/server";
import { TermsContent } from "@/components/terms/TermsContent";
import { Screen } from "@/components/ui/Screen";
import { BackButton } from "./BackButton";

// "What ParCare can and cannot do" + T&C (G10). Public, so it is always reachable: from Settings,
// the entry screen and the login page.
export default async function TermsPage() {
  const tp = await getTranslations("termsPage");
  const ts = await getTranslations("setup.terms");
  return (
    <Screen iconSize={64}>
      <h1 className="text-center text-xl font-semibold">{ts("title")}</h1>
      <TermsContent />
      <BackButton label={tp("back")} />
    </Screen>
  );
}
