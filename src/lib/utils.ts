export { clsx as cn } from "clsx";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Adres çubuğundan gelen kimlikleri sorguya koymadan önce doğrula. */
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

/** Sadece uygulama içi yollara yönlendirmeye izin verir (açık yönlendirme koruması). */
export function safeNext(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((p) => p.charAt(0).toLocaleUpperCase("tr-TR")).join("") || "?";
}

const AVATAR_TONES = [
  "bg-terracotta-soft text-terracotta-ink",
  "bg-sage-soft text-sage-deep",
  "bg-mustard-soft text-mustard-ink",
  "bg-sky-soft text-sky-ink",
  "bg-blush text-blush-ink",
];

/** Aynı isim her zaman aynı rengi alır. */
export function toneFor(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}
