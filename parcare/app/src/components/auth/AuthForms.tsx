"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import {
  type AuthFormState,
  type ForgotState,
  type NewPasswordState,
  demoLoginAction,
  demoNewSetupAction,
  forgotPasswordAction,
  loginAction,
  newPasswordAction,
  signupAction,
} from "@/auth/actions";
import { buttonStyles } from "@/components/ui/Screen";

const inputClass =
  "min-h-12 w-full rounded-lg border border-neutral-400 px-3 text-base outline-none focus:border-[#008069] focus:ring-2 focus:ring-[#008069]/30";

function ErrorText({ state }: { state: AuthFormState }) {
  const t = useTranslations("authErrors");
  if (!state.error) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-base text-red-800">
      {t(state.error)}
    </p>
  );
}

function EmailPasswordFields({ newPassword = false }: { newPassword?: boolean }) {
  const t = useTranslations("login");
  const ts = useTranslations("signup");
  return (
    <>
      <label className="flex flex-col gap-1 text-base">
        {t("email")}
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-base">
        {t("password")}
        <input
          name="password"
          type="password"
          autoComplete={newPassword ? "new-password" : "current-password"}
          required
          minLength={newPassword ? 8 : undefined}
          className={inputClass}
        />
        {newPassword && <span className="text-sm text-neutral-600">{ts("passwordHint")}</span>}
      </label>
    </>
  );
}

export function LoginForm({ demoMode }: { demoMode: boolean }) {
  const t = useTranslations("login");
  const [state, formAction, pending] = useActionState(loginAction, {});
  const [demoState, demoAction, demoPending] = useActionState(demoLoginAction, {});
  const [newState, newAction, newPending] = useActionState(demoNewSetupAction, {});

  return (
    <div className="flex w-full flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3">
        <EmailPasswordFields />
        <ErrorText state={state} />
        <button type="submit" disabled={pending} className={buttonStyles.primary}>
          {t("submit")}
        </button>
        <Link href="/forgot" className="inline-flex min-h-12 items-center justify-center text-base font-medium text-[#008069] underline">
          {t("forgotLink")}
        </Link>
      </form>

      {demoMode && (
        <form action={demoAction} className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-sm text-neutral-500" aria-hidden="true">
            <span className="h-px flex-1 bg-neutral-300" />
            {t("or")}
            <span className="h-px flex-1 bg-neutral-300" />
          </div>
          <button type="submit" disabled={demoPending} className={buttonStyles.secondary}>
            {t("demo")}
          </button>
          <p className="text-center text-sm text-neutral-600">{t("demoHint")}</p>
          <ErrorText state={demoState} />
        </form>
      )}
      {demoMode && (
        <form action={newAction} className="flex flex-col gap-2">
          <button type="submit" disabled={newPending} className={buttonStyles.secondary}>
            {t("demoNew")}
          </button>
          <p className="text-center text-sm text-neutral-600">{t("demoNewHint")}</p>
          <ErrorText state={newState} />
        </form>
      )}

      <p className="text-center text-base">
        {t("noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-[#008069] underline">
          {t("signupLink")}
        </Link>
      </p>
    </div>
  );
}

export function SignupForm() {
  const t = useTranslations("signup");
  const [state, formAction, pending] = useActionState(signupAction, {});
  return (
    <div className="flex w-full flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3">
        <EmailPasswordFields newPassword />
        <ErrorText state={state} />
        <button type="submit" disabled={pending} className={buttonStyles.primary}>
          {t("submit")}
        </button>
      </form>
      <p className="text-center text-base">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-[#008069] underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}

function FormError({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-base text-red-800">
      {text}
    </p>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("forgot");
  const te = useTranslations("forgotErrors");
  const [state, formAction, pending] = useActionState(forgotPasswordAction, { step: "email" } as ForgotState);
  const error = <FormError text={state.error ? te(state.error) : null} />;

  if (state.step === "email") {
    return (
      <div className="flex w-full flex-col gap-4">
        <p className="text-base">{t("intro")}</p>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="intent" value="send" />
          <label className="flex flex-col gap-1 text-base">
            {t("email")}
            <input name="email" type="email" autoComplete="email" required defaultValue={state.email} className={inputClass} />
          </label>
          {error}
          <button type="submit" disabled={pending} className={buttonStyles.primary}>
            {t("send")}
          </button>
        </form>
        <BackToLogin />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-base" data-testid="forgot-sent">
        {t("sentTo", { email: state.email ?? "" })}
      </p>
      <p className="text-base text-[#54656f]">{t("sameBrowser")}</p>
      {state.demoLink && (
        <div className="flex flex-col gap-2 rounded-lg bg-amber-50 px-3 py-2 text-base text-amber-900" data-testid="forgot-demo-link">
          <p>{t("demoLink")}</p>
          <a href={state.demoLink} className="font-semibold underline">
            {t("demoLinkButton")}
          </a>
        </div>
      )}
      {state.resent && <p className="rounded-lg bg-[#e7f5f1] px-3 py-2 text-base text-[#005c4b]">{t("resent")}</p>}
      {error}
      <form action={formAction}>
        <input type="hidden" name="intent" value="resend" />
        <input type="hidden" name="email" value={state.email ?? ""} />
        <button type="submit" disabled={pending} className={buttonStyles.secondary}>
          {t("resend")}
        </button>
      </form>
      <form action={formAction}>
        <input type="hidden" name="intent" value="restart" />
        <button type="submit" disabled={pending} className="min-h-12 w-full text-base font-medium text-[#008069] underline">
          {t("otherEmail")}
        </button>
      </form>
      <BackToLogin />
    </div>
  );
}

export function NewPasswordForm({ email }: { email: string }) {
  const t = useTranslations("resetPassword");
  const te = useTranslations("resetPasswordErrors");
  const [state, formAction, pending] = useActionState(newPasswordAction, {} as NewPasswordState);
  return (
    <div className="flex w-full flex-col gap-4">
      <p className="text-base">{t("intro", { email })}</p>
      <form action={formAction} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-base">
          {t("newPassword")}
          <input name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
        </label>
        <p className="-mt-2 text-sm text-neutral-600">{t("passwordHint")}</p>
        <label className="flex flex-col gap-1 text-base">
          {t("confirm")}
          <input name="confirm" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
        </label>
        <FormError text={state.error ? te(state.error) : null} />
        <button type="submit" disabled={pending} className={buttonStyles.primary}>
          {t("submit")}
        </button>
      </form>
    </div>
  );
}

function BackToLogin() {
  const t = useTranslations("forgot");
  return (
    <p className="text-center text-base">
      <Link href="/login" className="font-semibold text-[#008069] underline">
        {t("backToLogin")}
      </Link>
    </p>
  );
}
