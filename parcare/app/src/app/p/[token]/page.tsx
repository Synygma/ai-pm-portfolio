import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import { Suspense } from "react";
import { buttonStyles, Screen } from "@/components/ui/Screen";
import { getServiceRepos } from "@/data";
import { checkInvite } from "@/services/parent-session";
import { redeemInviteAction } from "../actions";

// The invite link from the child (setup step g). Opening the page only checks the link; the
// parent taps "Open my ParCare" to use it (so a chat app's link preview cannot use it up).
export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Screen>
      <Suspense fallback={null}>
        <Welcome params={params} />
      </Suspense>
    </Screen>
  );
}

async function Welcome({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  await connection(); // reads the clock (link expiry)
  const t = await getTranslations("parentApp.welcome");
  const repos = getServiceRepos();
  const check = await checkInvite(repos, token, new Date());
  if (!check.ok) {
    // For a used or expired link we know the family and can name the child.
    const household = check.householdId ? await repos.households.get(check.householdId) : null;
    const child = household ? await repos.profiles.get(household.childId) : null;
    const childName = child?.petName || child?.fullName.split(" ")[0] || "";
    return (
      <p role="alert" className="text-center text-lg" data-testid="invite-problem">
        {childName ? t(check.reason, { childName }) : t("invalidNoName")}
      </p>
    );
  }
  const child = await repos.profiles.get(check.household.childId);
  const childName = child?.petName || child?.fullName.split(" ")[0] || "";
  return (
    <>
      <h1 className="text-center text-2xl font-semibold">{t("title")}</h1>
      <p className="text-center text-lg">{t("body", { childName })}</p>
      <form action={redeemInviteAction.bind(null, token)} className="mt-4 w-full">
        <button type="submit" className={`${buttonStyles.primary} min-h-14 text-lg`}>
          {t("open")}
        </button>
      </form>
    </>
  );
}
