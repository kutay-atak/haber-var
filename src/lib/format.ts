// Tarih ve süre biçimleri. Sunucu ve e-postalar Türkiye saatini kullanır;
// tarayıcıda <LocalDateTime> bileşeni okuyucunun kendi saat dilimine çevirir.
import { INTL_LOCALE, type Locale } from "@/lib/i18n";

export const APP_TIME_ZONE = "Europe/Istanbul";

/** Sunucu bileşenlerinde "şimdi". Sayaçlar ve durum hesapları aynı anı kullansın diye tek yerden. */
export function requestTime(): number {
  return Date.now();
}

export function formatDate(iso: string, locale: Locale = "tr", timeZone: string = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: Locale = "tr", timeZone: string = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

const UNITS: Record<Locale, { day: [string, string]; hour: [string, string]; minute: [string, string] }> = {
  tr: { day: ["gün", "gün"], hour: ["saat", "saat"], minute: ["dakika", "dakika"] },
  en: { day: ["day", "days"], hour: ["hour", "hours"], minute: ["minute", "minutes"] },
};

/** "3 gün 4 saat", "5 saat 12 dakika", "8 dakika". Süre geçtiyse null. */
export function timeLeft(iso: string, now: number, locale: Locale = "tr"): string | null {
  const u = UNITS[locale];
  const n = (count: number, unit: [string, string]) => `${count} ${count === 1 ? unit[0] : unit[1]}`;
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return hours > 0 ? `${n(days, u.day)} ${n(hours, u.hour)}` : n(days, u.day);
  if (hours > 0) return mins > 0 ? `${n(hours, u.hour)} ${n(mins, u.minute)}` : n(hours, u.hour);
  return n(Math.max(mins, 1), u.minute);
}

export function formatBytes(bytes: number, locale: Locale = "tr"): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `${locale === "tr" ? mb.replace(".", ",") : mb} MB`;
}
