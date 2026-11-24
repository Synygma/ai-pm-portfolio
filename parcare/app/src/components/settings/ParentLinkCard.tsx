"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { newParentLinkAction } from "@/app/(app)/(tabs)/settings/actions";
import { buttonStyles } from "@/components/ui/Screen";

// "<parent>'s phone": a new one-time link if the parent changes phones. Shown once; only its hash is stored.
export function ParentLinkCard({ parentPetName }: { parentPetName: string }) {
  const t = useTranslations("settings.parentLink");
  const [link, setLink] = useState<{ url: string; shareUrl: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="rounded-xl border border-[#e9edef] p-4" data-testid="settings-parent-link">
      <h3 className="text-base font-semibold">{t("title", { parentPetName })}</h3>
      <p className="mt-1 text-sm text-[#54656f]">{t("hint", { parentPetName })}</p>
      {link ? (
        <div className="mt-2 flex flex-col gap-2">
          <p className="text-sm">{t("made")}</p>
          <p className="break-all rounded-lg bg-[#f0f2f5] px-3 py-2 text-sm" data-testid="parent-link-url">
            {link.url}
          </p>
          <a href={link.shareUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary}>
            {t("share")}
          </a>
        </div>
      ) : (
        <button
          type="button"
          className={`${buttonStyles.secondary} mt-2`}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await newParentLinkAction();
              if (r.ok) setLink({ url: r.url, shareUrl: r.shareUrl });
            })
          }
        >
          {t("make")}
        </button>
      )}
    </div>
  );
}
