"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, signIn, signUp, updatePassword, type FormState } from "@/actions/auth";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

function Messages({ state }: { state: FormState }) {
  if (state.error) return <Alert tone="error">{state.error}</Alert>;
  if (state.success) return <Alert tone="success">{state.success}</Alert>;
  return null;
}

export function LoginForm({ next }: { next: string | null }) {
  const [state, action] = useActionState(signIn, {});
  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="E-posta" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="ornek@mail.com" />
      </Field>
      <Field
        label={
          <span className="flex items-center justify-between">
            Şifre
            <Link href="/sifremi-unuttum" className="text-sm font-semibold text-terracotta-deep hover:underline">
              Şifremi unuttum
            </Link>
          </span>
        }
        htmlFor="password"
      >
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Messages state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Giriş yapılıyor…">
        Giriş yap
      </SubmitButton>
    </form>
  );
}

export function SignupForm({ next }: { next: string | null }) {
  const [state, action] = useActionState(signUp, {});
  if (state.success) return <Messages state={state} />;
  return (
    <form action={action} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Adın" htmlFor="name" hint="Gazetede yazılarının altında bu isim görünecek.">
        <Input id="name" name="name" autoComplete="name" required maxLength={60} placeholder="Ayşe" />
      </Field>
      <Field label="E-posta" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="ornek@mail.com" />
      </Field>
      <Field label="Şifre" htmlFor="password" hint="En az 8 karakter.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Messages state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Hesap açılıyor…">
        Hesabımı oluştur
      </SubmitButton>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="E-posta" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required placeholder="ornek@mail.com" />
      </Field>
      <Messages state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Gönderiliyor…">
        Yenileme linki gönder
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, {});
  return (
    <form action={action} className="space-y-4">
      <Field label="Yeni şifre" htmlFor="password" hint="En az 8 karakter.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Messages state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Kaydediliyor…">
        Şifremi güncelle
      </SubmitButton>
    </form>
  );
}
