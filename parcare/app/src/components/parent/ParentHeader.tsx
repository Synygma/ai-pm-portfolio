import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { brand, type Avatar } from "@/config/brand";

/** Green top bar of the parent app: her companion (or the ParCare icon before she chooses one). */
export async function ParentHeader({ companion, title }: { companion: Avatar | null; title?: string }) {
  const t = await getTranslations("parentApp");
  return (
    <header className="sticky top-0 z-10 flex min-h-16 items-center gap-3 bg-[#008069] px-3 pt-[env(safe-area-inset-top)] text-white">
      {companion ? (
        <AvatarCircle src={companion.image} alt="" size={48} />
      ) : (
        <Image src={brand.icons.icon192} alt="" width={44} height={44} className="rounded-full bg-white" />
      )}
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold leading-tight">{title ?? companion?.name ?? t("appTitle")}</h1>
        {!title && companion && <p className="truncate text-base text-white">{t("companionSubtitle")}</p>}
      </div>
    </header>
  );
}
