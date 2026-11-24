import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AddCheckin } from "@/components/parent/AddCheckin";
import { ParentHeader } from "@/components/parent/ParentHeader";
import { ReadAloudToggle } from "@/components/parent/ReadAloud";
import { PushToggle } from "@/components/settings/PushToggle";
import { buttonStyles } from "@/components/ui/Screen";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { selectableCompanions } from "@/config/brand";
import { requireParent } from "@/data/parent-access";
import { appNow } from "@/domain/clock";
import { GAP_CHOICES, timeChoices } from "@/domain/parent-setup";
import { listMyCheckins } from "@/services/parent-settings";
import {
  addCheckinAction,
  deleteMyWordsAction,
  removeParentPushAction,
  saveParentPushAction,
  setCheckinOnAction,
  setCompanionAction,
  setGapsAction,
  setSharedAction,
  setTimeAction,
  stopAllAction,
} from "./actions";

const card = "rounded-2xl border border-[#e9edef] bg-white p-4";
const small = "min-h-12 rounded-full border-2 px-4 text-base font-semibold";

// The parent's settings (G2, F23): who can see what, pause / resume, companion, reminder gaps,
// read aloud, notifications, deleting her own words, terms.
export default async function ParentSettingsPage({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const t = await getTranslations("parentApp.settings");
  return (
    <div className="flex flex-1 flex-col">
      <ParentHeader companion={null} title={t("title")} />
      <section className="flex flex-col gap-4 p-4">
        <Suspense fallback={null}>
          <Controls searchParams={searchParams} />
        </Suspense>
        <ReadAloudToggle />
        <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} save={saveParentPushAction} remove={removeParentPushAction} namespace="parentApp.push" />
        <Link href="/terms" className="flex min-h-14 items-center rounded-xl border border-[#e9edef] px-4 text-lg font-medium text-[#008069]">
          {t("terms")}
        </Link>
        <p className="rounded-xl border border-[#e9edef] p-4 text-lg">{t("language")}</p>
      </section>
    </div>
  );
}

async function Controls({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const t = await getTranslations("parentApp.settings");
  const me = await requireParent();
  const { deleted } = await searchParams;
  const items = await listMyCheckins(me.repos, me.household, me.parent, appNow(me.household));
  const { childName } = me;
  return (
    <>
      {deleted && (
        <p role="status" className="rounded-xl bg-[#e7f5f1] p-3 text-lg text-[#005c4b]">
          {t("deleteMine.done")}
        </p>
      )}

      <div className={card} data-testid="who-can-see">
        <h2 className="text-xl font-semibold">{t("who.title")}</h2>
        <p className="mt-1 text-lg text-[#54656f]">{t("who.intro", { childName })}</p>
        {items.length === 0 && <p className="mt-2 text-lg">{t("who.none")}</p>}
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((it) => (
            <li key={it.metaItemId} className="rounded-xl bg-[#f7f8fa] p-3" data-testid="my-checkin">
              <p className="text-lg font-semibold">
                {it.label} <span className="font-normal text-[#54656f]">· {it.localTime ?? t("who.noTime")}</span>
              </p>
              <p className="text-base">
                <span className={it.on ? "font-semibold text-[#008069]" : "font-semibold text-[#b54708]"} data-testid="my-checkin-state">
                  {it.on ? t("who.on") : it.agreed ? t("who.paused") : t("who.notChecked")}
                </span>
                {it.on && <span className="text-[#54656f]"> · {it.shared ? t("who.shared", { childName }) : t("who.notShared")}</span>}
              </p>
              {/* Change the time from the list (P-028). */}
              <form action={setTimeAction.bind(null, it.metaItemId)} className="mt-2 flex items-center gap-2">
                <select
                  name="time"
                  defaultValue={it.localTime ?? ""}
                  aria-label={t("who.timeFor", { label: it.label })}
                  className="min-h-12 flex-1 rounded-xl border border-neutral-400 bg-white px-3 text-lg"
                  data-testid="my-checkin-time"
                >
                  <option value="">{t("who.noTime")}</option>
                  {timeChoices(it.localTime).map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
                <button type="submit" className={`${small} border-[#008069] text-[#008069]`}>
                  {t("who.changeTime")}
                </button>
              </form>
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={setCheckinOnAction.bind(null, it.metaItemId, !it.on)}>
                  <button type="submit" className={`${small} ${it.on ? "border-[#b54708] text-[#b54708]" : "border-[#008069] text-[#008069]"}`}>
                    {it.on ? t("who.pause") : it.agreed ? t("who.resume") : t("who.turnOn")}
                  </button>
                </form>
                {it.on && (
                  <form action={setSharedAction.bind(null, it.metaItemId, !it.shared)}>
                    <button type="submit" className={`${small} border-[#008069] text-[#008069]`}>
                      {it.shared ? t("who.unshare") : t("who.share", { childName })}
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <AddCheckin action={addCheckinAction} childName={childName} />
        </div>
        {items.some((i) => i.on) && (
          <form action={stopAllAction} className="mt-4">
            <button type="submit" className={`${buttonStyles.secondary} min-h-14 border-[#b42318] text-lg text-[#b42318]`}>
              {t("who.stopAll")}
            </button>
            <p className="mt-1 text-base text-[#54656f]">{t("who.stopAllNote", { childName })}</p>
          </form>
        )}
      </div>

      <form action={setCompanionAction} className={card} data-testid="my-companion">
        <h2 className="text-xl font-semibold">{t("companion.title")}</h2>
        <p className="text-lg text-[#54656f]">{t("companion.note")}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {selectableCompanions.map((a) => (
            <label key={a.id} className="flex cursor-pointer flex-col items-center rounded-xl p-2 text-center has-[:checked]:bg-[#e7f5f1] has-[:checked]:ring-2 has-[:checked]:ring-[#008069]">
              <input type="radio" name="companion" value={a.id} defaultChecked={a.id === me.household.parentAvatarId} className="sr-only" />
              <AvatarCircle src={a.image} alt="" size={56} />
              <span className="mt-1 text-base font-semibold">{a.name}</span>
            </label>
          ))}
        </div>
        <button type="submit" className={`${buttonStyles.primary} mt-3 min-h-14 text-lg`}>
          {t("companion.save")}
        </button>
      </form>

      <form action={setGapsAction} className={card} data-testid="my-gaps">
        <h2 className="text-xl font-semibold">{t("gaps.title")}</h2>
        {(["gapA", "gapB"] as const).map((k) => (
          <label key={k} className="mt-2 flex flex-col gap-1 text-lg font-medium">
            {k === "gapA" ? t("gaps.gapA") : t("gaps.gapB", { childName })}
            <select name={k} defaultValue={k === "gapA" ? me.household.gapAMinutes : me.household.gapBMinutes} className="min-h-12 rounded-xl border border-neutral-400 bg-white px-3 text-lg">
              {GAP_CHOICES.map((n) => (
                <option key={n} value={n}>
                  {t("gaps.minutes", { n })}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button type="submit" className={`${buttonStyles.primary} mt-3 min-h-14 text-lg`}>
          {t("gaps.save")}
        </button>
      </form>

      <form action={deleteMyWordsAction} className={card} data-testid="delete-mine">
        <h2 className="text-xl font-semibold">{t("deleteMine.title")}</h2>
        <p className="mt-1 text-lg">{t("deleteMine.body", { childName })}</p>
        <label className="mt-3 flex min-h-12 items-center gap-3 text-lg">
          <input type="checkbox" name="confirm" required className="h-6 w-6 accent-[#b42318]" />
          {t("deleteMine.confirm")}
        </label>
        <button type="submit" className="mt-2 flex min-h-14 w-full items-center justify-center rounded-full bg-[#b42318] px-6 text-lg font-semibold text-white">
          {t("deleteMine.button")}
        </button>
      </form>
    </>
  );
}
