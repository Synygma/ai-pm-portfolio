"use client";

import { useTranslations } from "next-intl";
import { useContext, useEffect, useState, useTransition } from "react";
import {
  createInviteAction,
  finishSetupAction,
  markStepAction,
  saveChildAction,
  saveDayAction,
  saveEmergencyAction,
  saveParentsAction,
  suggestDayAction,
} from "@/app/(app)/setup/actions";
import { buttonStyles } from "@/components/ui/Screen";
import { AvatarCircle } from "@/components/wa/AvatarCircle";
import { selectableCompanions } from "@/config/brand";
import { CHECKIN_TYPES, type CheckinType } from "@/data/types";
import type { ChildInput, DayItemInput, FieldErrors, ParentInput } from "@/domain/setup";
import { normalizeTimeZone } from "@/domain/time";
import type { SetupState } from "@/services/setup";
import { PushToTalk } from "./PushToTalk";
import { CityInput, CountrySelect, TimeZoneSelect } from "@/components/places/pickers";
import { Bullets, Field, FieldError, inputClass, SaveLaterContext, StepActions, StepTitle } from "./ui";

export type StepProps = {
  state: SetupState;
  update: (patch: Partial<SetupState>) => void;
  onDone: () => void;
  onBack?: () => void;
  aiMode: "mock" | "gemini";
};

type Failure = { ok: false; errors?: FieldErrors; reason?: string };

/** Shared submit helper: runs the server action, shows field errors or a general error. */
function useSubmit() {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [reason, setReason] = useState<string | null>(null);
  function submit<R extends { ok: boolean }>(action: () => Promise<R>, onOk: (r: Extract<R, { ok: true }>) => void) {
    startTransition(async () => {
      try {
        const result = await action();
        if (!result) return; // redirected by the server action
        if (result.ok) {
          setErrors({});
          setReason(null);
          onOk(result as Extract<R, { ok: true }>);
        } else {
          const f = result as unknown as Failure;
          setErrors(f.errors ?? {});
          setReason(f.reason ?? (f.errors ? null : "generic"));
        }
      } catch (err) {
        // A redirect() from the server action is not an error.
        if (err && typeof err === "object" && "digest" in err && String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")) throw err;
        setReason("generic");
      }
    });
  }
  return { pending, errors, reason, submit, setReason };
}

function GeneralError({ reason }: { reason: string | null }) {
  const t = useTranslations("setup.errors");
  if (!reason) return null;
  return (
    <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-base text-red-800">
      {t(reason)}
    </p>
  );
}

const toAge = (v: string): number | null => (v.trim() === "" ? null : Number(v));

// --- a. Child details ---------------------------------------------------------------------

export function ChildStep({ state, update, onDone, onBack }: StepProps) {
  const leave = useContext(SaveLaterContext);
  const t = useTranslations("setup.child");
  const tf = useTranslations("setup.fields");
  const [form, setForm] = useState<ChildInput>(
    state.child ?? { fullName: "", petName: "", country: "", city: "", age: null, timeZone: "" },
  );
  const { pending, errors, reason, submit } = useSubmit();

  useEffect(() => {
    // Auto-detect the device time zone the first time (editable).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!form.timeZone) setForm((f) => ({ ...f, timeZone: normalizeTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) }));
  }, [form.timeZone]);

  const set = (k: keyof ChildInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "age" ? toAge(e.target.value) : e.target.value }));

  return (
    <div>
      <StepTitle title={t("title")} intro={t("intro")} />
      <div className="flex flex-col gap-4">
        <Field label={t("fullName")} error={errors.fullName}>
          {(p) => <input {...p} className={inputClass} autoComplete="name" value={form.fullName} onChange={set("fullName")} />}
        </Field>
        <Field label={t("petName")} hint={t("petNameHint")} error={errors.petName} optional>
          {(p) => <input {...p} className={inputClass} value={form.petName} onChange={set("petName")} />}
        </Field>
        <Field label={tf("country")} error={errors.country}>
          {(p) => <CountrySelect field={p} value={form.country} onChange={(country) => setForm((f) => ({ ...f, country, city: "" }))} />}
        </Field>
        <Field label={tf("city")} hint={tf("cityHint")} error={errors.city}>
          {(p) => (
            <CityInput
              field={p}
              country={form.country}
              value={form.city}
              onChange={(city) => setForm((f) => ({ ...f, city }))}
              onPick={(c) => c.timeZone && setForm((f) => ({ ...f, timeZone: c.timeZone! }))}
            />
          )}
        </Field>
        <Field label={tf("age")} error={errors.age} optional>
          {(p) => <input {...p} className={inputClass} type="number" inputMode="numeric" min={18} max={120} value={form.age ?? ""} onChange={set("age")} />}
        </Field>
        <Field label={tf("timeZone")} hint={t("timeZoneHint")} error={errors.timeZone}>
          {(p) => <TimeZoneSelect field={p} country={form.country} value={form.timeZone} onChange={(timeZone) => setForm((f) => ({ ...f, timeZone }))} />}
        </Field>
      </div>
      <GeneralError reason={reason} />
      <StepActions
        onBack={onBack}
        pending={pending}
        onNext={() =>
          submit(
            () => saveChildAction(form),
            () => {
              update({ child: form });
              onDone();
            },
          )
        }
        saveLater={() => submit(() => saveChildAction(form), leave)}
      />
    </div>
  );
}

// --- b. Parent details ----------------------------------------------------------------------

const newParent = (): ParentInput => ({ name: "", petName: "", gender: null, age: null, country: "India", city: "", timeZone: "Asia/Kolkata" });

export function ParentStep({ state, update, onDone, onBack }: StepProps) {
  const leave = useContext(SaveLaterContext);
  const t = useTranslations("setup.parent");
  const tf = useTranslations("setup.fields");
  const [parents, setParents] = useState<ParentInput[]>(state.parents.length ? state.parents : [newParent()]);
  const [managedIndex, setManagedIndex] = useState(state.managedIndex);
  const { pending, errors, reason, submit } = useSubmit();

  const setField = (i: number, k: keyof ParentInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = e.target.value;
    setParents((ps) =>
      ps.map((p, j) => (j !== i ? p : { ...p, [k]: k === "age" ? toAge(v) : k === "gender" ? (v || null) : v })),
    );
  };

  const patchParent = (i: number, patch: Partial<ParentInput>) => setParents((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  return (
    <div>
      <StepTitle title={t("title")} intro={t("intro")} />
      {parents.map((p, i) => (
        <fieldset key={i} className="mb-5 flex flex-col gap-4 rounded-xl border border-[#e9edef] p-4" data-testid={`parent-${i}`}>
          <legend className="px-1 text-base font-semibold">{t("parentN", { n: i + 1 })}</legend>
          <Field label={t("name")} error={errors[`${i}.name`]}>
            {(a) => <input {...a} className={inputClass} value={p.name} onChange={setField(i, "name")} />}
          </Field>
          <Field label={t("petName")} hint={t("petNameHint")} error={errors[`${i}.petName`]}>
            {(a) => <input {...a} className={inputClass} value={p.petName} onChange={setField(i, "petName")} />}
          </Field>
          <Field label={t("gender")} optional>
            {(a) => (
              <select {...a} className={inputClass} value={p.gender ?? ""} onChange={setField(i, "gender")}>
                <option value="">{t("choose")}</option>
                <option value="female">{t("genders.female")}</option>
                <option value="male">{t("genders.male")}</option>
                <option value="other">{t("genders.other")}</option>
              </select>
            )}
          </Field>
          <Field label={tf("age")} error={errors[`${i}.age`]} optional>
            {(a) => <input {...a} className={inputClass} type="number" inputMode="numeric" min={18} max={120} value={p.age ?? ""} onChange={setField(i, "age")} />}
          </Field>
          <Field label={tf("country")} error={errors[`${i}.country`]}>
            {(a) => <CountrySelect field={a} value={p.country} onChange={(country) => patchParent(i, { country, city: "" })} />}
          </Field>
          <Field label={tf("city")} hint={tf("cityHint")} error={errors[`${i}.city`]}>
            {(a) => (
              <CityInput
                field={a}
                country={p.country}
                value={p.city}
                onChange={(city) => patchParent(i, { city })}
                onPick={(c) => c.timeZone && patchParent(i, { timeZone: c.timeZone })}
              />
            )}
          </Field>
          <Field label={tf("timeZone")} hint={t("timeZoneHint")} error={errors[`${i}.timeZone`]}>
            {(a) => <TimeZoneSelect field={a} country={p.country} value={p.timeZone} onChange={(timeZone) => patchParent(i, { timeZone })} />}
          </Field>
        </fieldset>
      ))}

      {parents.length === 1 ? (
        <button type="button" className={buttonStyles.secondary} onClick={() => setParents((ps) => [...ps, newParent()])}>
          {t("addSecond")}
        </button>
      ) : (
        <>
          <button
            type="button"
            className={buttonStyles.secondary}
            onClick={() => {
              setParents((ps) => ps.slice(0, 1));
              setManagedIndex(0);
            }}
          >
            {t("removeSecond")}
          </button>
          <fieldset className="mt-5 rounded-xl bg-[#f0f2f5] p-4">
            <legend className="sr-only">{t("whichTitle")}</legend>
            <p className="text-base font-semibold">{t("whichTitle")}</p>
            <p className="mt-1 text-sm text-[#54656f]">{t("whichNote")}</p>
            <div className="mt-3 flex flex-col gap-2">
              {parents.map((p, i) => (
                <label key={i} className="flex min-h-12 items-center gap-3 text-base">
                  <input type="radio" name="managed" className="h-5 w-5 accent-[#008069]" checked={managedIndex === i} onChange={() => setManagedIndex(i)} />
                  {p.name.trim() || t("parentN", { n: i + 1 })}
                </label>
              ))}
            </div>
            <FieldError code={errors.managedIndex} />
          </fieldset>
        </>
      )}
      <GeneralError reason={reason} />
      <StepActions
        onBack={onBack}
        pending={pending}
        onNext={() =>
          submit(
            () => saveParentsAction({ parents, managedIndex }),
            () => {
              update({ parents, managedIndex });
              onDone();
            },
          )
        }
        saveLater={() => submit(() => saveParentsAction({ parents, managedIndex }), leave)}
      />
    </div>
  );
}

const petNameOf = (state: SetupState) => state.parents[state.managedIndex]?.petName || "";

// --- c, d, h. Information steps ---------------------------------------------------------------

function InfoStep({ step, onDone, onBack, children }: { step: "howItWorks" | "introduce" | "call"; onDone: () => void; onBack?: () => void; children: React.ReactNode }) {
  const { pending, reason, submit } = useSubmit();
  return (
    <div>
      {children}
      <GeneralError reason={reason} />
      <StepActions onBack={onBack} pending={pending} onNext={() => submit(() => markStepAction(step), onDone)} />
    </div>
  );
}

export function HowItWorksStep({ onDone, onBack }: StepProps) {
  const t = useTranslations("setup.howItWorks");
  return (
    <InfoStep step="howItWorks" onDone={onDone} onBack={onBack}>
      <StepTitle title={t("title")} />
      <Bullets ns="setup.howItWorks" list="points" />
    </InfoStep>
  );
}

export function IntroduceStep({ state, onDone, onBack }: StepProps) {
  const t = useTranslations("setup.introduce");
  const parentPetName = petNameOf(state);
  return (
    <InfoStep step="introduce" onDone={onDone} onBack={onBack}>
      <StepTitle title={t("title")} intro={t("intro", { parentPetName })} />
      <Bullets ns="setup.introduce" list="points" />
      <h3 className="mb-3 mt-6 text-lg font-semibold">{t("avatarsTitle", { parentPetName })}</h3>
      <ul className="grid grid-cols-3 gap-x-2 gap-y-4" data-testid="setup-companions">
        {selectableCompanions.map((a) => (
          <li key={a.id} className="flex flex-col items-center text-center">
            <AvatarCircle src={a.image} alt="" size={72} />
            <span className="mt-1 text-sm font-semibold leading-tight">{a.name}</span>
            <span className="text-xs leading-snug text-[#54656f]">{a.style}</span>
          </li>
        ))}
      </ul>
    </InfoStep>
  );
}

export function CallStep({ state, onDone, onBack }: StepProps) {
  const t = useTranslations("setup.call");
  const parentPetName = petNameOf(state);
  return (
    <InfoStep step="call" onDone={onDone} onBack={onBack}>
      <StepTitle title={t("title", { parentPetName })} />
      <Bullets ns="setup.call" list="points" values={{ parentPetName }} />
      <p className="mt-4 rounded-lg bg-[#f0f2f5] px-3 py-2 text-base">{t("note")}</p>
    </InfoStep>
  );
}

// --- e. Describe the parent's day -> AI meta list ---------------------------------------------

export function DayStep({ state, update, onDone, onBack, aiMode }: StepProps) {
  const leave = useContext(SaveLaterContext);
  const t = useTranslations("setup.day");
  const tt = useTranslations("checkinTypes");
  const parentPetName = petNameOf(state);
  const [transcript, setTranscript] = useState(state.day.transcript);
  const [items, setItems] = useState<DayItemInput[]>(state.day.items);
  const [notice, setNotice] = useState<string | null>(null);
  const [suggesting, startSuggest] = useTransition();
  const { pending, errors, reason, submit, setReason } = useSubmit();

  function suggest() {
    if (!transcript.trim()) return setNotice(t("empty"));
    startSuggest(async () => {
      const result = await suggestDayAction(transcript);
      if (!result.ok) {
        if (result.reason === "empty") setNotice(t("empty"));
        else setReason(result.reason);
        return;
      }
      setItems(result.items);
      setNotice(result.items.length === 0 ? t("noSuggestions") : result.fellBack ? t("fellBack") : null);
    });
  }

  const setItem = (i: number, patch: Partial<DayItemInput>) => setItems((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div>
      <StepTitle title={t("title", { parentPetName })} intro={t("intro")} />
      <PushToTalk onText={(text) => setTranscript((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text))} />
      <div className="mt-4">
        <Field label={t("typeLabel")}>
          {(p) => (
            <textarea {...p} rows={5} className={`${inputClass} py-2`} placeholder={t("placeholder")} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
          )}
        </Field>
      </div>
      <p className="mt-2 text-sm text-[#54656f]">{aiMode === "gemini" ? t("geminiNote") : t("mockNote")}</p>
      <button type="button" onClick={suggest} disabled={suggesting} className={`${buttonStyles.secondary} mt-3`}>
        {suggesting ? t("suggesting") : t("suggest")}
      </button>
      {notice && (
        <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-base text-amber-900">
          {notice}
        </p>
      )}

      {items.length > 0 && (
        <section className="mt-6" aria-labelledby="meta-list-title">
          <h3 id="meta-list-title" className="text-lg font-semibold">
            {t("listTitle")}
          </h3>
          <p className="mb-3 text-sm text-[#54656f]">{t("listIntro")}</p>
          <ul className="flex flex-col gap-3" data-testid="meta-list">
            {items.map((item, i) => (
              <li key={i} className={`rounded-xl border p-3 ${item.included ? "border-[#008069]/40 bg-[#f4fbf7]" : "border-[#e9edef] opacity-70"}`} data-testid="meta-item">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-6 w-6 shrink-0 accent-[#008069]"
                    checked={item.included}
                    aria-label={t("include", { label: item.label || t("newItem") })}
                    onChange={(e) => setItem(i, { included: e.target.checked })}
                  />
                  <input
                    className={inputClass}
                    aria-label={t("label")}
                    value={item.label}
                    onChange={(e) => setItem(i, { label: e.target.value })}
                    aria-invalid={Boolean(errors[`${i}.label`])}
                  />
                </div>
                <div className="mt-2 flex gap-2 pl-9">
                  <input
                    type="time"
                    className={`${inputClass} w-32`}
                    aria-label={t("time")}
                    value={item.localTime ?? ""}
                    onChange={(e) => setItem(i, { localTime: e.target.value || null })}
                  />
                  <select
                    className={inputClass}
                    aria-label={t("type")}
                    value={item.checkinType}
                    onChange={(e) => setItem(i, { checkinType: e.target.value as CheckinType })}
                  >
                    {CHECKIN_TYPES.map((c) => (
                      <option key={c} value={c}>
                        {tt(c)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pl-9">
                  <FieldError code={errors[`${i}.label`] ?? errors[`${i}.localTime`]} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <button
        type="button"
        className={`${buttonStyles.secondary} mt-3`}
        onClick={() => setItems((list) => [...list, { label: "", checkinType: "woken_up", localTime: null, included: true }])}
      >
        {t("addItem")}
      </button>
      <FieldError code={errors.items} />
      <p className="mt-4 rounded-lg bg-[#f0f2f5] px-3 py-2 text-base">{t("parentNote", { parentPetName })}</p>
      <GeneralError reason={reason} />
      <StepActions
        onBack={onBack}
        pending={pending}
        onNext={() =>
          submit(
            () => saveDayAction(items, transcript),
            () => {
              update({ day: { transcript, items: items.filter((x) => x.included) } });
              onDone();
            },
          )
        }
        // Save the list if there is one; before the list is made there is nothing to keep yet.
        saveLater={() => (items.some((x) => x.included) ? submit(() => saveDayAction(items, transcript), leave) : leave())}
      />
    </div>
  );
}

// --- f. Emergency contact (G7) ---------------------------------------------------------------

export function EmergencyStep({ state, update, onDone, onBack }: StepProps) {
  const t = useTranslations("setup.emergency");
  const ts = useTranslations("setup");
  const parentPetName = petNameOf(state);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [told, setTold] = useState<boolean | null>(null);
  const [notStoredFor, setNotStoredFor] = useState<string | null>(null);
  const { pending, errors, reason, submit } = useSubmit();

  if (notStoredFor !== null) {
    return (
      <div>
        <StepTitle title={t("title")} />
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-base text-amber-900" data-testid="emergency-not-stored">
          {t("notStored", { name: notStoredFor })}
        </p>
        <StepActions onBack={() => setNotStoredFor(null)} onNext={onDone} nextLabel={t("continue")} />
      </div>
    );
  }

  return (
    <div>
      <StepTitle title={t("title")} intro={t("intro", { parentPetName })} />
      {state.emergency && <p className="mb-4 rounded-lg bg-[#f4fbf7] px-3 py-2 text-base">{t("existing", state.emergency)}</p>}
      <div className="flex flex-col gap-4">
        <Field label={t("name")} error={errors.name}>
          {(p) => <input {...p} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label={t("phone")} error={errors.phone}>
          {(p) => <input {...p} className={inputClass} type="tel" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} />}
        </Field>
        <fieldset>
          <legend className="text-base font-medium">{t("toldQuestion")}</legend>
          <div className="mt-2 flex gap-6">
            {([true, false] as const).map((v) => (
              <label key={String(v)} className="flex min-h-12 items-center gap-2 text-base">
                <input type="radio" name="told" className="h-5 w-5 accent-[#008069]" checked={told === v} onChange={() => setTold(v)} />
                {v ? t("yes") : t("no")}
              </label>
            ))}
          </div>
          <FieldError code={errors.told} />
        </fieldset>
      </div>
      <GeneralError reason={reason} />
      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          className={buttonStyles.primary}
          disabled={pending}
          onClick={() =>
            submit(
              () => saveEmergencyAction({ choice: "add", name, phone, told }),
              (r) => {
                if (r.outcome === "store") {
                  update({ emergency: { name: name.trim(), phone: phone.trim() }, emergencyChoice: "stored" });
                  onDone();
                } else {
                  // G7: nothing was stored. Clear the typed details from the screen too.
                  update({ emergencyChoice: "notStored" });
                  setNotStoredFor(name.trim());
                  setName("");
                  setPhone("");
                  setTold(null);
                }
              },
            )
          }
        >
          {t("save")}
        </button>
        <div className="flex gap-3">
          {onBack && (
            <button type="button" className={`${buttonStyles.secondary} flex-1`} onClick={onBack} disabled={pending}>
              {ts("back")}
            </button>
          )}
          <button
            type="button"
            className={`${buttonStyles.secondary} flex-[2]`}
            disabled={pending}
            onClick={() =>
              submit(
                () => saveEmergencyAction({ choice: "skip" }),
                () => {
                  update({ emergencyChoice: "skipped" });
                  onDone();
                },
              )
            }
          >
            {t("skip")}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- g. Invite link ----------------------------------------------------------------------------

export function InviteStep({ state, onDone, onBack }: StepProps) {
  const t = useTranslations("setup.invite");
  const parentPetName = petNameOf(state);
  const [invite, setInvite] = useState<{ url: string; shareUrl: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { pending, reason, submit } = useSubmit();
  const alreadyDone = state.completed > 6;

  const create = () => submit(createInviteAction, (r) => {
    setInvite({ url: r.url, shareUrl: r.shareUrl });
    setCopied(false);
  });

  return (
    <div>
      <StepTitle title={t("title", { parentPetName })} intro={t("intro", { parentPetName })} />
      {invite ? (
        <div className="flex flex-col gap-3" data-testid="invite-ready">
          <p className="break-all rounded-lg bg-[#f0f2f5] px-3 py-2 font-mono text-sm" data-testid="invite-url">
            {invite.url}
          </p>
          <a href={invite.shareUrl} target="_blank" rel="noopener noreferrer" className={buttonStyles.primary} data-testid="invite-share">
            {t("share")}
          </a>
          <button
            type="button"
            className={buttonStyles.secondary}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(invite.url);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? t("copied") : t("copy")}
          </button>
          <button type="button" className="min-h-12 text-base font-medium text-[#008069] underline" onClick={create} disabled={pending}>
            {t("recreate")}
          </button>
          <p className="text-sm text-[#54656f]">{t("recreateNote")}</p>
        </div>
      ) : (
        <>
          {alreadyDone && <p className="mb-3 text-sm text-[#54656f]">{t("resumeNote")}</p>}
          <button type="button" className={buttonStyles.primary} onClick={create} disabled={pending}>
            {t("create")}
          </button>
        </>
      )}
      <GeneralError reason={reason} />
      <StepActions onBack={onBack} onNext={onDone} nextDisabled={!invite && !alreadyDone} />
    </div>
  );
}

// --- i. Can / cannot + T&C (G10) ----------------------------------------------------------------

export function TermsStep({ state, onBack }: StepProps) {
  const t = useTranslations("setup.terms");
  const tc = useTranslations("commitments");
  const parentPetName = petNameOf(state);
  const [accepted, setAccepted] = useState(false);
  const { pending, reason, submit } = useSubmit();
  return (
    <div>
      <StepTitle title={t("title")} />
      <h3 className="mb-2 text-lg font-semibold">{tc("canTitle")}</h3>
      <Bullets ns="commitments" list="canDo" />
      <h3 className="mb-2 mt-5 text-lg font-semibold">{tc("cannotTitle")}</h3>
      <Bullets ns="commitments" list="cannotDo" />
      <h3 className="mb-2 mt-5 text-lg font-semibold">{tc("termsTitle")}</h3>
      <Bullets ns="commitments" list="terms" />
      <label className="mt-6 flex min-h-12 items-center gap-3 rounded-xl border-2 border-[#008069] p-3 text-base font-medium">
        <input type="checkbox" className="h-6 w-6 accent-[#008069]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        {t("accept")}
      </label>
      <p className="mt-2 text-sm text-[#54656f]">{t("parentNote", { parentPetName })}</p>
      <GeneralError reason={reason} />
      <StepActions onBack={onBack} pending={pending} nextLabel={t("finish")} onNext={() => submit(() => finishSetupAction(accepted), () => {})} />
    </div>
  );
}
