import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage, translator, type Locale, type T } from "@/lib/i18n";

/** Ziyaretçinin dili: önce seçtiği dil (çerez), yoksa tarayıcısının dili. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
});

export async function getT(): Promise<T> {
  return translator(await getLocale());
}
