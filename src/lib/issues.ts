import type { Issue, IssueStatus, TemplateId } from "@/lib/types";

/**
 * Sayının gerçek durumu: süresi dolmuş bir "open" sayı, zamanlanmış iş
 * veritabanını güncellemeden önce de yayımlanmış kabul edilir
 * (veritabanındaki issue_is_published() ile aynı kural).
 */
export function effectiveStatus(
  issue: Pick<Issue, "status" | "deadline_at">,
  now: number = Date.now(),
): IssueStatus {
  if (issue.status === "open" && new Date(issue.deadline_at).getTime() <= now) return "published";
  return issue.status;
}

export function issueLabel(issue: Pick<Issue, "number" | "title">): string {
  return issue.title?.trim() ? `Sayı ${issue.number} · ${issue.title.trim()}` : `Sayı ${issue.number}`;
}

export const MAX_QUESTIONS_PER_ISSUE = 10;

export const TEMPLATES: Record<
  TemplateId,
  { name: string; slug: string; emoji: string; description: string }
> = {
  classic: {
    name: "Klasik Gazete",
    slug: "gazete",
    emoji: "📰",
    description: "Sütunlar, büyük manşetler ve siyah-beyaz fotoğraflar.",
  },
  magazine: {
    name: "Modern Dergi",
    slug: "dergi",
    emoji: "✨",
    description: "Kapak fotoğrafı, ferah sayfalar ve büyük alıntılar.",
  },
  scrapbook: {
    name: "Karalama Defteri",
    slug: "defter",
    emoji: "✂️",
    description: "Polaroidler, bant parçaları ve el yazısı notlar.",
  },
  letter: {
    name: "Mektup",
    slug: "mektup",
    emoji: "💌",
    description: "Her yanıt bir mektup: pullar, damgalar ve imzalar.",
  },
  album: {
    name: "Fotoğraf Albümü",
    slug: "album",
    emoji: "📸",
    description: "Önce fotoğraflar: büyük kareler, kısa notlar.",
  },
  minimal: {
    name: "Sade",
    slug: "sade",
    emoji: "◻️",
    description: "Bol beyaz alan, tek sütun, sakin bir okuma.",
  },
  night: {
    name: "Gece Baskısı",
    slug: "gece",
    emoji: "🌙",
    description: "Koyu zemin, parlak vurgular, gece okumalarına.",
  },
  tabloid: {
    name: "Bulvar Gazetesi",
    slug: "bulvar",
    emoji: "📢",
    description: "Kırmızı manşetler, \"SON DAKİKA\" bantları, bol heyecan.",
  },
  retro: {
    name: "Retro Fanzin",
    slug: "retro",
    emoji: "🕺",
    description: "70'ler renkleri, güneş desenleri ve kalın harfler.",
  },
};

export const TEMPLATE_IDS = Object.keys(TEMPLATES) as TemplateId[];

export function templateFromSlug(slug: unknown): TemplateId | null {
  if (typeof slug !== "string") return null;
  return TEMPLATE_IDS.find((id) => TEMPLATES[id].slug === slug) ?? null;
}

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && (TEMPLATE_IDS as string[]).includes(value);
}
