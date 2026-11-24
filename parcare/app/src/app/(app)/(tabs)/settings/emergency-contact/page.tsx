import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { EmergencyContactForm } from "@/components/settings/EmergencyContactForm";
import { SubPageHeader } from "@/components/settings/SubPageHeader";
import { getRepos } from "@/data";
import { requireChild } from "@/data/access";

export default async function EmergencyContactPage() {
  const t = await getTranslations("emergencyContact");
  return (
    <div className="flex flex-col">
      <SubPageHeader title={t("title")} backLabel={t("back")} />
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </div>
  );
}

async function Form() {
  const { household, parent } = await requireChild();
  if (!household) return null;
  const contact = (await (await getRepos()).emergencyContacts.find({ householdId: household.id }))[0] ?? null;
  return <EmergencyContactForm current={contact ? { name: contact.name, phone: contact.phone } : null} parentPetName={parent?.petName ?? ""} />;
}
