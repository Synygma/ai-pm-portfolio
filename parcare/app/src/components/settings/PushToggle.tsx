"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import { removePushSubscriptionAction, savePushSubscriptionAction } from "@/app/(app)/(tabs)/settings/actions";
import { OnOffChoice } from "@/components/ui/OnOffChoice";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type Status = "loading" | "unsupported" | "notConfigured" | "denied" | "off" | "on" | "failed";

type Sub = { endpoint: string; keys: { p256dh: string; auth: string } };

// Notifications on/off (Web Push). The child's Settings uses the child's actions; the parent app
// passes its own (her phone gets the companion's questions, not the child's alarms).
export function PushToggle({
  publicKey,
  save = savePushSubscriptionAction,
  remove = removePushSubscriptionAction,
  namespace = "settings.push",
  nudge = false,
}: {
  publicKey: string;
  save?: (sub: Sub) => Promise<{ ok: boolean }>;
  remove?: (endpoint: string) => Promise<{ ok: boolean }>;
  namespace?: string;
  /** A banner in her chat: shown only while notifications are off (or blocked) on this phone. */
  nudge?: boolean;
}) {
  const t = useTranslations(namespace);
  const [status, setStatus] = useState<Status>("loading");
  const [pending, start] = useTransition();

  useEffect(() => {
    async function detect(): Promise<Status> {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
      if (!publicKey) return "notConfigured";
      if (Notification.permission === "denied") return "denied";
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (!sub) return "off";
      // The phone may be signed up for the other app (child / parent) only, or an earlier save may
      // have failed: "On" only once ParCare has it for this side (P-034).
      const json = sub.toJSON() as Sub;
      const r = await save({ endpoint: json.endpoint, keys: json.keys }).catch(() => ({ ok: false }));
      return r.ok ? "on" : "off";
    }
    void detect()
      .catch((): Status => "off")
      .then(setStatus);
  }, [publicKey, save]);

  function turnOn() {
    start(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return setStatus(permission === "denied" ? "denied" : "off");
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource }));
        const json = sub.toJSON() as Sub;
        const r = await save({ endpoint: json.endpoint, keys: json.keys });
        setStatus(r.ok ? "on" : "failed");
      } catch {
        setStatus("failed");
      }
    });
  }

  function turnOff() {
    start(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await remove(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    });
  }

  if (nudge) {
    if (status !== "off" && status !== "denied" && status !== "failed") return null;
    return (
      <div className="mx-3 mt-2 rounded-xl bg-[#fff3c4] p-3 text-[#3b2f00]" data-testid="push-nudge">
        <p className="text-base">{t("nudge")}</p>
        {status === "failed" && <p className="mt-1 text-sm">{t("status.failed")}</p>}
        {status === "denied" ? (
          <p className="mt-1 text-sm">{t("status.denied")}</p>
        ) : (
          <button type="button" className="mt-2 min-h-12 w-full rounded-full bg-[#008069] px-4 text-base font-semibold text-white" disabled={pending} onClick={turnOn}>
            {t("turnOn")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#e9edef] p-4" data-testid="push-toggle">
      <h3 className="text-base font-semibold">{t("title")}</h3>
      <p className="mt-1 text-sm text-[#54656f]" data-testid="push-status">
        {status === "loading" ? "" : t(`status.${status}`)}
      </p>
      {/* Both choices are always shown; "On" is greyed out when this browser or server cannot do it. */}
      <div className="mt-3">
        <OnOffChoice
          label={t("title")}
          on={status === "on"}
          onChange={(value) => (value ? turnOn() : turnOff())}
          disabled={pending || status === "loading"}
          onDisabled={status !== "on" && status !== "off" && status !== "failed"}
          testId="push-choice"
        />
      </div>
      <p className="mt-3 text-xs text-[#54656f]">{t("limit")}</p>
    </div>
  );
}
