import type { ReactionKey } from "@/lib/types";

// Gazetedeki yanıtlara verilebilecek tepkiler. Anahtarlar veritabanında saklanır
// (bkz. reactions tablosu); emoji ve adlar sadece ekranda kullanılır.
export const REACTIONS: ReadonlyArray<{ key: ReactionKey; emoji: string; tr: string; en: string }> = [
  { key: "heart", emoji: "❤️", tr: "Bayıldım", en: "Love it" },
  { key: "laugh", emoji: "😂", tr: "Güldüm", en: "Haha" },
  { key: "wow", emoji: "😮", tr: "Vay be", en: "Wow" },
  { key: "sad", emoji: "😢", tr: "Üzüldüm", en: "Sad" },
  { key: "clap", emoji: "👏", tr: "Alkış", en: "Applause" },
  { key: "fire", emoji: "🔥", tr: "Efsane", en: "Fire" },
];

export const REACTION_KEYS: readonly ReactionKey[] = REACTIONS.map((r) => r.key);
