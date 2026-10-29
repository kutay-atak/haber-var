"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authErrorMessage } from "@/lib/errors";
import { appUrl } from "@/lib/server-env";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

export interface FormState {
  error?: string;
  success?: string;
}

const email = z
  .string({ error: "Geçerli bir e-posta adresi gir." })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Geçerli bir e-posta adresi gir." }));
const password = z
  .string()
  .min(8, { error: "Şifre en az 8 karakter olmalı." })
  .max(72, { error: "Şifre en fazla 72 karakter olabilir." });

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({ email, password: z.string().min(1, { error: "Şifreni yazmayı unuttun." }) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error.message) };

  redirect(safeNext(formData.get("next")) ?? "/gruplar");
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { error: "Arkadaşların seni nasıl tanısın? Adını yaz." })
        .max(60, { error: "Ad en fazla 60 karakter olabilir." }),
      email,
      password,
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
    options: { data: { full_name: parsed.data.name } },
  });
  if (error) return { error: authErrorMessage(error.message) };

  if (!data.session) {
    // Supabase'de "Confirm email" hâlâ açıksa oturum hemen açılmaz.
    return {
      success:
        "Hesabın oluşturuldu! Giriş yapmadan önce e-postana gelen onay linkine tıkla. (Bu adımı istemiyorsan Supabase → Authentication → Email ayarından \"Confirm email\" seçeneğini kapat.)",
    };
  }

  redirect(safeNext(formData.get("next")) ?? "/gruplar");
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl()}/auth/callback?next=/sifre-yenile`,
  });
  if (error && /rate limit/i.test(error.message)) return { error: authErrorMessage(error.message) };

  // Hesabın var olup olmadığını belli etmemek için her durumda aynı mesaj.
  return {
    success: "Bu adrese kayıtlı bir hesap varsa şifre yenileme linki gönderdik. Gelen kutunu (ve spam klasörünü) kontrol et.",
  };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = password.safeParse(formData.get("password"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { error: authErrorMessage(error.message) };

  redirect("/gruplar");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
