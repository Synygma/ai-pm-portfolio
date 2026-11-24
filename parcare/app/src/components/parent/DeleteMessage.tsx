"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { deleteMessageAction } from "@/app/p/(parent)/actions";

// "Delete" on a bubble in her chat, then the familiar question (P-028): "Delete for everyone"
// (only for what she sent: removed from her chat, the child's chat and Helper list, and any
// summary) or "Delete for me" (hidden in her chat only).
// The child's chat uses it too (P-030), with its own action and only "Delete for me".
export function DeleteMessage({
  messageId,
  canEveryone,
  childName = "",
  action = deleteMessageAction,
  namespace = "parentApp.chat.delete",
}: {
  messageId: string;
  canEveryone: boolean;
  childName?: string;
  action?: (messageId: string, scope: "me" | "everyone") => Promise<{ ok: boolean }>;
  namespace?: string;
}) {
  const t = useTranslations(namespace);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);

  const remove = (scope: "me" | "everyone") =>
    start(async () => {
      const r = await action(messageId, scope).catch(() => ({ ok: false }));
      if (!r.ok) {
        setFailed(true);
        return;
      }
      setOpen(false);
      router.refresh();
    });

  const choice = "flex min-h-14 w-full items-center justify-center rounded-full px-5 text-lg font-semibold";
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFailed(false);
          setOpen(true);
        }}
        className="-ml-1 inline-flex min-h-11 items-center gap-1 rounded-full px-2 text-sm font-medium text-[#54656f] hover:bg-black/5"
        data-testid="delete-message"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
          <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Zm4 2v8h2v-8h-2Zm4 0v8h2v-8h-2Z" />
        </svg>
        {t("button")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="presentation" onClick={() => !pending && setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`del-${messageId}`}
            className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="delete-dialog"
          >
            <h2 id={`del-${messageId}`} className="text-xl font-semibold">
              {t("title")}
            </h2>
            {canEveryone ? (
              <p className="text-base text-[#54656f]">{t("everyoneNote", { childName, otherName: childName })}</p>
            ) : (
              t.has("meNote") && <p className="text-base text-[#54656f]">{t("meNote")}</p>
            )}
            {canEveryone && (
              <button type="button" disabled={pending} onClick={() => remove("everyone")} className={`${choice} bg-[#b42318] text-white`}>
                {t("everyone")}
              </button>
            )}
            <button type="button" disabled={pending} onClick={() => remove("me")} className={`${choice} border-2 border-[#008069] text-[#008069]`}>
              {t("me")}
            </button>
            <button type="button" disabled={pending} onClick={() => setOpen(false)} className={`${choice} text-[#54656f]`}>
              {t("cancel")}
            </button>
            {failed && (
              <p role="alert" className="text-base text-red-800">
                {t("failed")}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
