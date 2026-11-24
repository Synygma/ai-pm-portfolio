import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { signOutAction } from "@/auth/actions";
import { DigestTimeForm } from "@/components/settings/DigestTimeForm";
import { ParentLinkCard } from "@/components/settings/ParentLinkCard";
import { PushToggle } from "@/components/settings/PushToggle";
import { RetentionForm } from "@/components/settings/RetentionForm";
import { TimeZoneForm } from "@/components/settings/TimeZoneForm";
import { buttonStyles } from "@/components/ui/Screen";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { ListSkeleton } from "@/components/wa/ListSkeleton";
import { getAvatar } from "@/config/brand";
import { isDemoMode } from "@/config/env";
import { getDataMode, getRepos } from "@/data";
import { requireChild } from "@/data/access";
import type { MetaItemRow } from "@/data/types";
import { appNow } from "@/domain/clock";
import { activeConsents } from "@/domain/engine";
import { nextChildReview } from "@/domain/review";
import { convertLocalTime, localDate } from "@/domain/time";
import { formatCalendarDate } from "@/i18n/format";

const card = "rounded-xl border border-[#e9edef] p-4";
const linkRow = "flex min-h-12 items-center rounded-xl border border-[#e9edef] px-4 text-base font-medium text-[#008069]";

// Settings (5.10). The parent's check-ins and companion are read-only here (G2): the parent
// controls them in their app.
export default async function SettingsPage() {
  const t = await getTranslations("settings");
  return (
    <section className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <Suspense fallback={<ListSkeleton />}>
        <SettingsBody />
      </Suspense>
      <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      <LanguageCard />
      <Link href="/alerts" className={linkRow}>
        {t("alertsLink")}
      </Link>
      {isDemoMode() && (
        <Link href="/demo" className={`${linkRow} border-dashed border-[#c8cdd0] text-[#111b21]`} data-testid="demo-link">
          {t("demoLink")}
        </Link>
      )}
      <form action={signOutAction}>
        <button type="submit" className={buttonStyles.secondary}>
          {t("logOut")}
        </button>
      </form>
      <Link
        href="/settings/delete"
        className="flex min-h-12 items-center justify-center text-base font-medium text-[#b42318] underline"
        data-testid="delete-link"
      >
        {t("deleteLink")}
      </Link>
    </section>
  );
}

async function SettingsBody() {
  const t = await getTranslations("settings");
  const locale = await getLocale();
  const { profile, household, parent } = await requireChild();
  if (!household || !parent) return null;
  const repos = await getRepos();
  const now = appNow(household);
  const childTz = profile?.timeZone ?? "UTC";
  const parentPetName = parent.petName;
  const [metaItems, consents, contacts, terms, reviews] = await Promise.all([
    repos.metaItems.find({ householdId: household.id, parentId: parent.id }),
    repos.consents.find({ householdId: household.id }),
    repos.emergencyContacts.find({ householdId: household.id }),
    repos.termsAcceptances.find({ householdId: household.id, role: "child" }, { orderBy: "acceptedAt", desc: true }),
    repos.reviewPrompts.find({ householdId: household.id }),
  ]);

  // Consented items (G1): only these are checked. The rest wait for the parent.
  const active = new Map(activeConsents(consents, now).map((c) => [c.metaItemId, c]));
  const byTime = (a: MetaItemRow, b: MetaItemRow) => (a.onDate ?? "").localeCompare(b.onDate ?? "") || (a.localTime ?? "99").localeCompare(b.localTime ?? "99");
  const consented = metaItems.filter((m) => active.has(m.id)).sort(byTime);
  const waiting = consents.length === 0 ? metaItems.filter((m) => m.source === "child").sort(byTime) : [];
  const today = localDate(now, parent.timeZone);
  const when = (m: MetaItemRow) => {
    if (!m.localTime) return t("checkins.noTime");
    const child = convertLocalTime(m.onDate ?? today, m.localTime, parent.timeZone, childTz);
    const time = t("checkins.time", {
      time: m.localTime,
      parentPetName,
      childTime: child.time,
    });
    return m.onDate ? `${t("checkins.onDate", { date: formatCalendarDate(m.onDate, locale, "long") })}, ${time}` : time;
  };
  const tTypes = await getTranslations("checkinTypes");

  const avatar = household.parentAvatarId ? getAvatar(household.parentAvatarId) : null;
  const contact = contacts[0] ?? null;
  const accepted = terms[0] ?? null;
  const nextReview = nextChildReview(reviews, now);
  const tb = await getTranslations("bubbles");

  return (
    <>
      <div className={card} data-testid="settings-account">
        {profile && <p className="text-base">{t("signedInAs", { name: profile.fullName })}</p>}
        <p className="mt-1 text-sm text-[#54656f]">{getDataMode() === "supabase" ? t("dataSupabase") : t("dataMemory")}</p>
      </div>

      <div className={card} data-testid="settings-checkins">
        <h3 className="text-base font-semibold">{t("checkins.title", { parentPetName })}</h3>
        <p className="mt-1 text-sm text-[#54656f]">{t("checkins.controls", { parentPetName })}</p>
        {consents.length > 0 && consented.length === 0 && (
          <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-base font-medium text-amber-900" data-testid="settings-all-disabled">
            {tb("allDisabled", { petName: parentPetName })}
          </p>
        )}
        {consents.length === 0 && <p className="mt-3 rounded-lg bg-[#f0f2f5] px-3 py-2 text-base">{t("checkins.none", { parentPetName })}</p>}
        {consented.length > 0 && (
          <ul className="mt-3 divide-y divide-[#e9edef]">
            {consented.map((m) => (
              <li key={m.id} className="py-2" data-testid="settings-checkin">
                <p className="text-base font-medium text-[#111b21]">{m.label}</p>
                <p className="text-sm text-[#54656f]">
                  {tTypes(m.checkinType) === m.label ? when(m) : `${tTypes(m.checkinType)} · ${when(m)}`}
                </p>
                <p className="text-xs text-[#54656f]">{active.get(m.id)!.shareInDigest ? t("checkins.inDigest") : t("checkins.notInDigest")}</p>
              </li>
            ))}
          </ul>
        )}
        {waiting.length > 0 && (
          <div className="mt-3" data-testid="settings-waiting">
            <h4 className="text-sm font-semibold">{t("checkins.waitingTitle", { parentPetName })}</h4>
            <p className="text-sm text-[#54656f]">{t("checkins.waitingHint", { parentPetName })}</p>
            <ul className="mt-1 list-disc pl-5 text-base">
              {waiting.map((m) => (
                <li key={m.id}>
                  {m.label} <span className="text-sm text-[#54656f]">({when(m)})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={card} data-testid="settings-companion">
        <h3 className="text-base font-semibold">{t("companion.title", { parentPetName })}</h3>
        <div className="mt-2 flex items-center gap-3">
          {avatar && <AvatarCircle src={avatar.image} alt="" size={56} />}
          <div className="min-w-0">
            <p className="text-base">{avatar ? t("companion.chosen", { name: avatar.name, parentPetName }) : t("companion.notChosen", { parentPetName })}</p>
            {avatar && <p className="text-sm text-[#54656f]">{avatar.style}</p>}
            <p className="text-sm font-medium text-[#54656f]">{t("companion.readOnly")}</p>
          </div>
        </div>
        <Link href="/settings/companions" className="mt-2 inline-flex min-h-12 items-center font-medium text-[#008069] underline">
          {t("companion.gallery")}
        </Link>
      </div>

      <DigestTimeForm initial={household.digestLocalTime} timeZone={childTz} />
      <TimeZoneForm initial={childTz} />
      <RetentionForm initial={household.retentionDays ?? 30} parentPetName={parentPetName} />

      <ParentLinkCard parentPetName={parentPetName} />

      <div className={card} data-testid="settings-emergency">
        <h3 className="text-base font-semibold">{t("emergency.title")}</h3>
        <p className="mt-1 text-base">{contact ? t("emergency.saved", { name: contact.name, phone: contact.phone }) : t("emergency.none")}</p>
        <p className="text-sm text-[#54656f]">{t("emergency.note")}</p>
        <Link href="/settings/emergency-contact" className="mt-1 inline-flex min-h-12 items-center font-medium text-[#008069] underline">
          {contact ? t("emergency.change") : t("emergency.add")}
        </Link>
      </div>

      <div className={card} data-testid="settings-review">
        <h3 className="text-base font-semibold">{t("review.title")}</h3>
        <p className="mt-1 text-sm text-[#54656f]">{t("review.about", { parentPetName })}</p>
        {nextReview && (
          <p className="mt-1 text-base">
            {t("review.next", {
              date: formatCalendarDate(localDate(new Date(nextReview), childTz), locale, "long"),
            })}
          </p>
        )}
      </div>

      <div className={card}>
        <Link href="/terms" className="inline-flex min-h-12 items-center text-base font-medium text-[#008069] underline" data-testid="terms-link">
          {t("termsLink")}
        </Link>
        {accepted && (
          <p className="text-sm text-[#54656f]" data-testid="terms-accepted">
            {t("termsAccepted", {
              version: accepted.termsVersion,
              date: formatCalendarDate(localDate(new Date(accepted.acceptedAt), childTz), locale, "long"),
            })}
          </p>
        )}
      </div>
    </>
  );
}

async function LanguageCard() {
  const t = await getTranslations("settings.language");
  return (
    <div className={card}>
      <label htmlFor="settings-language" className="text-base font-semibold">
        {t("title")}
      </label>
      <select
        id="settings-language"
        defaultValue="en"
        className="mt-2 min-h-12 w-full rounded-lg border border-neutral-400 bg-white px-3 text-base"
        data-testid="language-select"
      >
        <option value="en">{t("english")}</option>
        <option value="hi" disabled>
          {t("hindiSoon")}
        </option>
      </select>
      <p className="mt-1 text-sm text-[#54656f]">{t("hint")}</p>
    </div>
  );
}
