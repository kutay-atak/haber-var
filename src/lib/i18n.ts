// Dil desteği: Türkçe (varsayılan) ve İngilizce.
// Metinler kodun içinde yan yana durur: t("Türkçe", "English").
// Sunucuda getT() (src/lib/i18n-server.ts), tarayıcıda useT() (src/components/i18n.tsx) kullanılır.

export type Locale = "tr" | "en";

export const LOCALES: readonly Locale[] = ["tr", "en"];
export const DEFAULT_LOCALE: Locale = "tr";
export const LOCALE_COOKIE = "hv-locale";

/** Intl biçimlendiricileri için dil etiketi. */
export const INTL_LOCALE: Record<Locale, string> = { tr: "tr-TR", en: "en-GB" };

export type T = (tr: string, en: string) => string;

const TR: T = (tr) => tr;
const EN: T = (_tr, en) => en;

export function translator(locale: Locale): T {
  return locale === "en" ? EN : TR;
}

export function isLocale(value: unknown): value is Locale {
  return value === "tr" || value === "en";
}

/** Çerez yoksa tarayıcının dil tercihine bakılır: Türkçe isteyen Türkçe, diğer herkes İngilizce görür. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  if (!first) return DEFAULT_LOCALE;
  return first.startsWith("tr") ? "tr" : "en";
}

/** Tarayıcıda, React dışındaki kodda (ör. fotoğraf/video işleme) sayfanın dili. */
export function documentT(): T {
  return translator(typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "tr");
}
