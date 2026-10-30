"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authErrorMessage } from "@/lib/errors";
import type { T } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { appUrl } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

export interface FormState {
  error?: string;
  success?: string;
}

const email = (t: T) =>
  z
    .string({ error: t("Geçerli bir e-posta adresi gir.", "Enter a valid email address.") })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: t("Geçerli bir e-posta adresi gir.", "Enter a valid email address.") }));
const password = (t: T) =>
  z
    .string()
    .min(8, { error: t("Şifre en az 8 karakter olmalı.", "The password must be at least 8 characters.") })
    .max(72, { error: t("Şifre en fazla 72 karakter olabilir.", "The password can be at most 72 characters.") });

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const parsed = z
    .object({ email: email(t), password: z.string().min(1, { error: t("Şifreni yazmayı unuttun.", "You forgot to enter your password.") }) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error.message, t) };

  redirect(safeNext(formData.get("next")) ?? "/gruplar");
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const parsed = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { error: t("Arkadaşların seni nasıl tanısın? Adını yaz.", "How will your friends know it's you? Enter your name.") })
        .max(60, { error: t("Ad en fazla 60 karakter olabilir.", "The name can be at most 60 characters.") }),
      email: email(t),
      password: password(t),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.name, locale: t("tr", "en") } },
  });
  if (error) return { error: authErrorMessage(error.message, t) };

  if (!data.session) {
    // Supabase'de "Confirm email" hâlâ açıksa oturum hemen açılmaz.
    return {
      success: t(
        "Hesabın oluşturuldu. Giriş yapmadan önce e-postana gelen onay linkine tıkla. (Bu adımı istemiyorsan Supabase → Authentication → Email ayarından \"Confirm email\" seçeneğini kapat.)",
        "Your account has been created. Click the confirmation link in your email before logging in. (If you don't want this step, turn off \"Confirm email\" in Supabase → Authentication → Email.)",
      ),
    };
  }

  redirect(safeNext(formData.get("next")) ?? "/gruplar");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const parsed = email(t).safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl()}/auth/callback?next=/sifre-yenile`,
  });
  if (error && /rate limit/i.test(error.message)) return { error: authErrorMessage(error.message, t) };

  // Hesabın var olup olmadığını belli etmemek için her durumda aynı mesaj.
  return {
    success: t(
      "Bu adrese kayıtlı bir hesap varsa şifre yenileme linki gönderdik. Gelen kutunu (ve spam klasörünü) kontrol et.",
      "If an account exists for this address, we've sent a password reset link. Check your inbox (and spam folder).",
    ),
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  const parsed = password(t).safeParse(formData.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: authErrorMessage(error.message, t) };

  redirect("/gruplar");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
