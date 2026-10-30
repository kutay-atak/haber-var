"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword, type FormState } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/components/i18n";

function Messages({ state }: { state: FormState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return null;
}

export function LoginForm({ next }: { next: string | null }) {
  const [state, action] = useActionState(signIn, {});
  const t = useT();
  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label={t("E-posta", "Email")} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder={t("ornek@mail.com", "you@example.com")} />
      </Field>
      <Field
        label={
          <span className="flex items-center justify-between">
            {t("Şifre", "Password")}
            <Link href="/sifremi-unuttum" className="text-sm font-semibold text-terracotta-deep hover:underline">
              {t("Şifremi unuttum", "Forgot password?")}
            </Link>
          </span>
        }
        htmlFor="password"
      >
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Messages state={state} />
      <SubmitButton size="lg" className="w-full" pendingText={t("Giriş yapılıyor…", "Logging in…")}>
        {t("Giriş yap", "Log in")}
      </SubmitButton>
    </form>
  );
}

export function SignupForm({ next }: { next: string | null }) {
  const [state, action] = useActionState(signUp, {});
  const t = useT();
  if (state.success) return <Messages state={state} />;
  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field
        label={t("Adın", "Your name")}
        htmlFor="name"
        hint={t("Gazetede yazılarının altında bu isim görünecek.", "This name will appear under your stories in the newspaper.")}
      >
        <Input id="name" name="name" autoComplete="name" required maxLength={60} placeholder={t("Ayşe", "Alex")} />
      </Field>
      <Field label={t("E-posta", "Email")} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder={t("ornek@mail.com", "you@example.com")} />
      </Field>
      <Field label={t("Şifre", "Password")} htmlFor="password" hint={t("En az 8 karakter.", "At least 8 characters.")}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Messages state={state} />
      <SubmitButton size="lg" className="w-full" pendingText={t("Hesap açılıyor…", "Creating your account…")}>
        {t("Hesabımı oluştur", "Create my account")}
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, {});
  const t = useT();
  return (
    <form action={action} className="space-y-4">
      <Field label={t("E-posta", "Email")} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder={t("ornek@mail.com", "you@example.com")} />
      </Field>
      <Messages state={state} />
      <SubmitButton size="lg" className="w-full" pendingText={t("Gönderiliyor…", "Sending…")}>
        {t("Yenileme linki gönder", "Send reset link")}
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, {});
  const t = useT();
  return (
    <form action={action} className="space-y-4">
      <Field label={t("Yeni şifre", "New password")} htmlFor="password" hint={t("En az 8 karakter.", "At least 8 characters.")}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Messages state={state} />
      <SubmitButton size="lg" className="w-full" pendingText={t("Kaydediliyor…", "Saving…")}>
        {t("Şifremi güncelle", "Update my password")}
      </SubmitButton>
    </form>
  );
}
