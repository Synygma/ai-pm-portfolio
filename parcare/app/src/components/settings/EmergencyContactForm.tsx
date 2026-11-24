"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { type EmergencyContactState, saveEmergencyContactAction } from "@/app/(app)/(tabs)/settings/actions";
import { Field, FieldError, inputClass } from "@/components/setup/ui";
import { buttonStyles } from "@/components/ui/Screen";

// Settings: add, replace or remove the emergency contact. G7: a contact is stored only when the
// child answers "Yes" to "Have you told this person ...?". On "No" nothing is stored.
export function EmergencyContactForm({ current, parentPetName }: { current: { name: string; phone: string } | null; parentPetName: string }) {
  const t = useTranslations("emergencyContact");
  const ts = useTranslations("setup.emergency");
  const [state, formAction, pending] = useActionState<EmergencyContactState, FormData>(saveEmergencyContactAction, { status: "idle" });
  const errors = state.status === "invalid" ? state.errors : {};
  // React resets the form after each submit, so a "No" leaves nothing typed on screen (G7);
  // after a validation error the typed values come back from the server.
  const values = state.status === "invalid" ? state.values : { name: "", phone: "" };

  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="text-base">{ts("intro", { parentPetName })}</p>
      {state.status === "saved" && (
        <p role="status" className="rounded-lg bg-[#f4fbf7] px-3 py-2 text-base text-[#005c4b]">
          {t("saved", { name: state.name })}
        </p>
      )}
      {state.status === "removed" && (
        <p role="status" className="rounded-lg bg-[#f0f2f5] px-3 py-2 text-base">
          {t("removed")}
        </p>
      )}
      {state.status === "notStored" && (
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-base text-amber-900" data-testid="emergency-not-stored">
          {ts("notStored", { name: state.name })}
        </p>
      )}

      {current && (
        <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-[#e9edef] p-4" data-testid="emergency-current">
          <p className="text-base font-medium">{t("current", current)}</p>
          <input type="hidden" name="intent" value="remove" />
          <button type="submit" className={buttonStyles.secondary} disabled={pending}>
            {t("remove")}
          </button>
        </form>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        {current && <p className="text-sm text-[#54656f]">{t("replaceHint")}</p>}
        <Field label={ts("name")} error={errors.name}>
          {(p) => <input {...p} name="name" defaultValue={values.name} className={inputClass} maxLength={80} />}
        </Field>
        <Field label={ts("phone")} error={errors.phone}>
          {(p) => <input {...p} name="phone" defaultValue={values.phone} className={inputClass} type="tel" inputMode="tel" autoComplete="off" maxLength={30} />}
        </Field>
        <fieldset>
          <legend className="text-base font-medium">{ts("toldQuestion")}</legend>
          <div className="mt-2 flex gap-6">
            {(["yes", "no"] as const).map((v) => (
              <label key={v} className="flex min-h-12 items-center gap-2 text-base">
                <input type="radio" name="told" value={v} className="h-5 w-5 accent-[#008069]" />
                {ts(v)}
              </label>
            ))}
          </div>
          <FieldError code={errors.told} />
        </fieldset>
        <button type="submit" className={buttonStyles.primary} disabled={pending}>
          {t("save")}
        </button>
      </form>
    </div>
  );
}
