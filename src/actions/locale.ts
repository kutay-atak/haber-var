"use server";

import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

/** Arayüz dilini değiştirir. Giriş yapmışsa e-postalar da bu dilde gelsin diye hesaba da yazılır. */
export async function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  if (await getSessionUser()) {
    const supabase = await createClient();
    await supabase.auth.updateUser({ data: { locale } });
  }
}
