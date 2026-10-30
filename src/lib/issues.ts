import { translator, type Locale, type T } from "@/lib/i18n";
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

export function issueLabel(issue: Pick<Issue, "number" | "title">, t: T = translator("tr")): string {
  const label = `${t("Sayı", "Issue")} ${issue.number}`;
  return issue.title?.trim() ? `${label} · ${issue.title.trim()}` : label;
}

export const MAX_QUESTIONS_PER_ISSUE = 10;

export const TEMPLATES: Record<
  TemplateId,
  { name: string; nameEn: string; slug: string; emoji: string; description: string; descriptionEn: string }
> = {
  classic: {
    name: "Klasik Gazete",
    nameEn: "Classic Newspaper",
    slug: "gazete",
    emoji: "📰",
    description: "Sütunlar, büyük manşetler ve siyah-beyaz fotoğraflar.",
    descriptionEn: "Columns, big headlines and black-and-white photos.",
  },
  magazine: {
    name: "Modern Dergi",
    nameEn: "Modern Magazine",
    slug: "dergi",
    emoji: "✨",
    description: "Kapak fotoğrafı, ferah sayfalar ve büyük alıntılar.",
    descriptionEn: "A cover photo, airy pages and big quotes.",
  },
  scrapbook: {
    name: "Karalama Defteri",
    nameEn: "Scrapbook",
    slug: "defter",
    emoji: "✂️",
    description: "Polaroidler, bant parçaları ve el yazısı notlar.",
    descriptionEn: "Polaroids, strips of tape and handwritten notes.",
  },
  letter: {
    name: "Mektup",
    nameEn: "Letter",
    slug: "mektup",
    emoji: "💌",
    description: "Her yanıt bir mektup: pullar, damgalar ve imzalar.",
    descriptionEn: "Every answer is a letter: stamps, postmarks and signatures.",
  },
  album: {
    name: "Fotoğraf Albümü",
    nameEn: "Photo Album",
    slug: "album",
    emoji: "📸",
    description: "Önce fotoğraflar: büyük kareler, kısa notlar.",
    descriptionEn: "Photos first: big frames, short notes.",
  },
  minimal: {
    name: "Sade",
    nameEn: "Minimal",
    slug: "sade",
    emoji: "◻️",
    description: "Bol beyaz alan, tek sütun, sakin bir okuma.",
    descriptionEn: "Lots of white space, one column, a calm read.",
  },
  night: {
    name: "Gece Baskısı",
    nameEn: "Night Edition",
    slug: "gece",
    emoji: "🌙",
    description: "Koyu zemin, parlak vurgular, gece okumalarına.",
    descriptionEn: "A dark background with bright accents, for late-night reading.",
  },
  tabloid: {
    name: "Bulvar Gazetesi",
    nameEn: "Tabloid",
    slug: "bulvar",
    emoji: "📢",
    description: "Kırmızı manşetler, \"SON DAKİKA\" bantları, bol heyecan.",
    descriptionEn: "Red headlines, \"BREAKING\" banners and lots of excitement.",
  },
  retro: {
    name: "Retro Fanzin",
    nameEn: "Retro Zine",
    slug: "retro",
    emoji: "🕺",
    description: "70'ler renkleri, güneş desenleri ve kalın harfler.",
    descriptionEn: "70s colours, sunbursts and chunky letters.",
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

/** Şablonun seçili dildeki adı ve açıklaması. */
export function templateText(id: TemplateId, locale: Locale): { name: string; description: string } {
  const tpl = TEMPLATES[id];
  return locale === "en" ? { name: tpl.nameEn, description: tpl.descriptionEn } : { name: tpl.name, description: tpl.description };
}
