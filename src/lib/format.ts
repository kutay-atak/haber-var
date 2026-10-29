// Tarih ve süre biçimleri. Sunucu ve e-postalar Türkiye saatini kullanır;
// tarayıcıda <LocalDateTime> bileşeni okuyucunun kendi saat dilimine çevirir.

export const APP_TIME_ZONE = "Europe/Istanbul";

/** Sunucu bileşenlerinde "şimdi". Sayaçlar ve durum hesapları aynı anı kullansın diye tek yerden. */
export function requestTime(): number {
  return Date.now();
}

export function formatDate(iso: string, timeZone: string = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, timeZone: string = APP_TIME_ZONE): string {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

/** "3 gün 4 saat", "5 saat 12 dakika", "8 dakika". Süre geçtiyse null. */
export function timeLeft(iso: string, now: number): string | null {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return hours > 0 ? `${days} gün ${hours} saat` : `${days} gün`;
  if (hours > 0) return mins > 0 ? `${hours} saat ${mins} dakika` : `${hours} saat`;
  return `${Math.max(mins, 1)} dakika`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
