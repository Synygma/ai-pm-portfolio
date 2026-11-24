import { getTranslations } from "next-intl/server";
import { TERMS_VERSION } from "@/config/terms";

/** "What ParCare can and cannot do" + terms in short bullets (G10), with the version. */
export async function TermsContent() {
  const t = await getTranslations("commitments");
  const lists = [
    ["canTitle", "canDo"],
    ["cannotTitle", "cannotDo"],
    ["termsTitle", "terms"],
  ] as const;
  return (
    <div className="w-full" data-testid="terms-content">
      {lists.map(([title, list]) => (
        <section key={list} className="mt-4">
          <h2 className="mb-2 text-lg font-semibold">{t(title)}</h2>
          <ul className="flex list-disc flex-col gap-2 pl-6 text-base leading-snug">
            {Object.keys(t.raw(list) as Record<string, string>).map((k) => (
              <li key={k}>{t(`${list}.${k}`)}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-4 text-sm text-[#54656f]">{t("version", { version: TERMS_VERSION })}</p>
    </div>
  );
}
