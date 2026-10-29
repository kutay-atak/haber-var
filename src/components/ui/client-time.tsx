"use client";

import { useSyncExternalStore } from "react";
import { APP_TIME_ZONE, formatDateTime, timeLeft } from "@/lib/format";

const noopSubscribe = () => () => {};

/** Sunucuda false, tarayıcıda true. Saat dilimi gibi tarayıcıya özel değerler için. */
export function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function subscribeMinute(callback: () => void) {
  const id = window.setInterval(callback, 30_000);
  return () => window.clearInterval(id);
}

/** Yarım dakikada bir güncellenen "şimdi". Sunucuda verilen başlangıç değeri kullanılır. */
export function useNow(serverNow: number) {
  return useSyncExternalStore(
    subscribeMinute,
    () => Math.floor(Date.now() / 30_000) * 30_000,
    () => serverNow,
  );
}

/** Tarihi okuyucunun kendi saat diliminde gösterir. */
export function LocalDateTime({ iso, className }: { iso: string; className?: string }) {
  const isClient = useIsClient();
  const zone = isClient ? Intl.DateTimeFormat().resolvedOptions().timeZone : APP_TIME_ZONE;
  return (
    <time dateTime={iso} className={className}>
      {formatDateTime(iso, zone)}
    </time>
  );
}

/** "3 gün 4 saat kaldı" sayacı. */
export function Countdown({
  iso,
  serverNow,
  suffix = "kaldı",
  expired = "Süre doldu",
}: {
  iso: string;
  serverNow: number;
  suffix?: string;
  expired?: string;
}) {
  const now = useNow(serverNow);
  const left = timeLeft(iso, now);
  return <span>{left ? `${left} ${suffix}` : expired}</span>;
}
