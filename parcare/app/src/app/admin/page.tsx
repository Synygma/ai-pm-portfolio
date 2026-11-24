import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { listLogins } from "@/auth";
import { requireAdmin } from "@/auth/admin";
import { SendNoteForm } from "@/components/admin/AdminForms";
import { getServiceRepos } from "@/data";
import { BAND_DAYS, BAND_HIGH, BAND_MID, type Band } from "@/domain/admin";
import { listAdminUsers } from "@/services/admin";
import { adminLogoutAction, deleteUserAction } from "./actions";

const card = "rounded-2xl border border-[#e9edef] bg-white p-4";
const BANDS: Band[] = ["active", "partly", "low", "notStarted"];
const bandColour: Record<Band, string> = {
  active: "bg-[#e7f5f1] text-[#005c4b]",
  partly: "bg-amber-50 text-amber-900",
  low: "bg-red-50 text-red-800",
  notStarted: "bg-[#f0f2f5] text-[#54656f]",
};
const when = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

// The admin page (P-027): logins with activity bands, delete a test user, gentle check-in notes.
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ deleted?: string; deleteFailed?: string }> }) {
  const t = await getTranslations("admin");
  return (
    <div className="flex min-h-dvh flex-col bg-[#f0f2f5]">
      <header className="flex min-h-16 items-center justify-between bg-[#008069] px-4 text-white">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <form action={adminLogoutAction}>
          <button type="submit" className="min-h-12 rounded-full px-3 text-base font-medium underline">
            {t("logOut")}
          </button>
        </form>
      </header>
      <Suspense fallback={null}>
        <Body searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Body({ searchParams }: { searchParams: Promise<{ deleted?: string; deleteFailed?: string }> }) {
  await requireAdmin();
  const t = await getTranslations("admin");
  const { deleted, deleteFailed } = await searchParams;
  const repos = getServiceRepos();
  const [users, broadcasts] = await Promise.all([listLogins().then((l) => listAdminUsers(repos, l)), 
    // Before migration 0007 has been run the log table is missing: show the page without it.
    repos.adminBroadcasts.find({}).catch(() => []),
  ]);
  const counts = Object.fromEntries(BANDS.map((b) => [b, users.filter((u) => u.activity.band === b).length])) as Record<Band, number>;
  const rule = (b: Band) =>
    b === "active"
      ? t("bands.activeRule", { high: BAND_HIGH })
      : b === "partly"
        ? t("bands.partlyRule", { mid: BAND_MID, below: BAND_HIGH - 1 })
        : b === "low"
          ? t("bands.lowRule", { mid: BAND_MID })
          : t("bands.notStartedRule");

  return (
    <main className="flex flex-col gap-4 p-4">
      {deleted && (
        <p role="status" className="rounded-xl bg-[#e7f5f1] p-3 text-base text-[#005c4b]" data-testid="user-deleted">
          {t("users.deleted")}
        </p>
      )}
      {deleteFailed && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-base text-red-800">
          {t("users.deleteFailed")}
        </p>
      )}

      <section className={card} data-testid="bands">
        <h2 className="text-lg font-semibold">{t("bands.title", { days: BAND_DAYS })}</h2>
        <p className="mt-1 text-sm text-[#54656f]">{t("bands.intro")}</p>
        <ul className="mt-3 grid grid-cols-2 gap-2">
          {BANDS.map((b) => (
            <li key={b} className={`rounded-xl p-3 ${bandColour[b]}`} data-testid={`band-${b}`}>
              <p className="text-2xl font-semibold">{counts[b]}</p>
              <p className="text-base font-semibold">{t(`bands.${b}`)}</p>
              <p className="text-sm">{rule(b)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-lg font-semibold">{t("note.title")}</h2>
        <div className="mt-2">
          <SendNoteForm />
        </div>
        {broadcasts.length > 0 && (
          <>
            <h3 className="mt-4 text-base font-semibold">{t("note.history")}</h3>
            <ul className="mt-1 flex flex-col gap-2">
              {broadcasts
                .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
                .slice(0, 10)
                .map((b) => (
                  <li key={b.id} className="rounded-lg bg-[#f7f8fa] p-2 text-sm">
                    <p className="text-[#54656f]">{t("note.historyItem", { date: when(b.sentAt), families: b.families })}</p>
                    <p>{b.message}</p>
                  </li>
                ))}
            </ul>
          </>
        )}
      </section>

      <section className={card} data-testid="users">
        <h2 className="text-lg font-semibold">{t("users.title", { count: users.length })}</h2>
        {users.length === 0 && <p className="mt-2 text-base">{t("users.none")}</p>}
        <ul className="mt-3 flex flex-col gap-3">
          {users.map((u) => (
            <li key={u.id} className="rounded-xl border border-[#e9edef] p-3" data-testid="admin-user">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-all text-base font-semibold">{u.email}</p>
                  <p className="text-sm text-[#54656f]">
                    {u.name ?? t("users.noName")} · {t("users.created", { date: when(u.createdAt) })}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${bandColour[u.activity.band]}`} data-testid="user-band">
                  {t(`bands.${u.activity.band}`)}
                  {u.activity.percent !== null && ` · ${u.activity.percent}%`}
                </span>
              </div>
              <p className="mt-1 text-sm">{u.setupDone ? t("users.setupDone") : t("users.setupNotDone")}</p>
              <p className="text-sm">{u.parentSetupDone ? t("users.parentDone", { name: u.parentName ?? "" }) : t("users.parentNotDone")}</p>
              {u.activity.asked > 0 && <p className="text-sm text-[#54656f]">{t("bands.detail", { answered: u.activity.answered, asked: u.activity.asked, alarms: u.activity.alarms })}</p>}
              {u.locked ? (
                <p className="mt-2 text-sm text-[#54656f]">{t("users.sample")}</p>
              ) : (
                <form action={deleteUserAction.bind(null, u.id)} className="mt-2 flex flex-col gap-2">
                  <label className="flex min-h-12 items-center gap-3 text-sm">
                    <input type="checkbox" name="confirm" required className="h-6 w-6 accent-[#b42318]" />
                    {t("users.confirm")}
                  </label>
                  <button type="submit" className="min-h-12 rounded-full bg-[#b42318] px-5 text-base font-semibold text-white hover:bg-[#912018]" data-testid="delete-user">
                    {t("users.delete")}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
