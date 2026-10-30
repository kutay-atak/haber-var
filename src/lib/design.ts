import { INTL_LOCALE, type Locale } from "@/lib/i18n";
import type { CSSProperties } from "react";
import { z } from "zod";
import {
  FILTERS,
  FONT_PAIRS,
  PALETTES,
  PAPERS,
  SHAPES,
  TEMPLATE_DEFAULTS,
  type PaletteId,
  type ShapeId,
} from "@/lib/design-options";
import type { NewsMedia, NewsPerson, NewspaperData } from "@/lib/newspaper";
import type { TemplateId } from "@/lib/types";

// Gazete tasarım ayarları. Veritabanında issues.design ve groups.default_design
// sütunlarında JSON olarak durur. Okurken her alan doğrulanır; geçersiz ya da eksik
// bir değer sessizce varsayılana döner, yani bozuk veri sayfayı asla bozmaz.

const ids = <T extends object>(o: T) => Object.keys(o) as [Extract<keyof T, string>, ...Extract<keyof T, string>[]];

const text = (max: number) => z.string().trim().max(max).catch("");

// "template" = şablonun kendi tercihi.
export const designSchema = z.object({
  // Metinler
  mastheadTitle: text(60),
  tagline: text(100),
  editorNote: text(1500),
  editorSignature: text(60),
  closingNote: text(500),
  // Renk ve yazı
  palette: z.enum([...ids(PALETTES), "template"]).catch("template"),
  accentColor: z.union([z.string().regex(/^#[0-9a-fA-F]{6}$/), z.literal("")]).catch(""),
  fontPair: z.enum([...ids(FONT_PAIRS), "template"]).catch("template"),
  textSize: z.enum(["s", "m", "l"]).catch("m"),
  // Sayfa
  paper: z.enum([...ids(PAPERS), "template"]).catch("template"),
  columns: z.enum(["template", "1", "2", "3"]).catch("template"),
  density: z.enum(["airy", "cozy", "compact"]).catch("cozy"),
  align: z.enum(["template", "center", "left"]).catch("template"),
  decorations: z.enum(["none", "some", "lots"]).catch("some"),
  // Fotoğraflar
  photoFilter: z.enum([...ids(FILTERS), "template"]).catch("template"),
  photoShape: z.enum([...ids(SHAPES), "template"]).catch("template"),
  photoSize: z.enum(["s", "m", "l"]).catch("l"),
  /** "auto", "none" ya da bir fotoğrafın kimliği */
  cover: z.string().max(64).catch("auto"),
  // Düzen
  arrangement: z.enum(["question", "person"]).catch("question"),
  order: z.enum(["time", "name", "shuffle"]).catch("time"),
  dropCap: z.boolean().catch(true),
  showAvatars: z.boolean().catch(true),
  showNumbers: z.boolean().catch(true),
  showContributors: z.boolean().catch(true),
  showDate: z.boolean().catch(true),
  showStats: z.boolean().catch(true),
});

export type NewspaperDesign = z.infer<typeof designSchema>;

export function parseDesign(raw: unknown): NewspaperDesign {
  return designSchema.parse(raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {});
}

export const DEFAULT_DESIGN: NewspaperDesign = parseDesign({});

/** Grubun varsayılanına sadece her sayıda tekrar edecek ayarlar geçer. */
export function toGroupDefault(design: NewspaperDesign): NewspaperDesign {
  return { ...design, editorNote: "", cover: "auto" };
}

// ── Renk yardımcıları ─────────────────────────────────────────────────────

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgbList = (hex: string) => rgb(hex).join(" ");

function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** İki rengi karıştırır (amount = b'nin oranı). */
function mix(a: string, b: string, amount: number) {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * amount);
  return `#${[m(r1, r2), m(g1, g2), m(b1, b2)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Verilen zemin üzerinde okunacak yazı rengi (beyaz ya da koyu). */
function readableOn(hex: string) {
  return luminance(hex) > 0.36 ? "#16161d" : "#ffffff";
}

/** Seçili (ya da şablonun kendi) renk paleti; stüdyodaki küçük önizlemeler için. */
export function effectivePalette(design: NewspaperDesign, template: TemplateId) {
  const p = PALETTES[design.palette === "template" ? TEMPLATE_DEFAULTS[template].palette : design.palette];
  return { ...p, accent: design.accentColor || p.accent };
}

/** Bir kâğıt dokusunun verilen palette nasıl göründüğü (stüdyodaki küçük kareler için). */
export function paperPreviewStyle(paperId: keyof typeof PAPERS, palette: ReturnType<typeof effectivePalette>): CSSProperties {
  return {
    backgroundColor: palette.paper,
    ...PAPERS[paperId].css(rgbList(palette.ink), rgbList(palette.accent), rgbList(palette.highlight)),
  } as CSSProperties;
}

// ── Çözümleme ─────────────────────────────────────────────────────────────

export interface ResolvedDesign {
  template: TemplateId;
  /** Gazetedeki sabit metinlerin dili ("yazıyor" / "writes" gibi) */
  locale: Locale;
  title: string;
  tagline: string;
  editorNote: string;
  editorSignature: string;
  closingNote: string;
  align: "center" | "left";
  decorations: NewspaperDesign["decorations"];
  dropCap: boolean;
  show: { avatars: boolean; numbers: boolean; contributors: boolean; date: boolean; stats: boolean };
  photoShape: ShapeId;
  arrangement: NewspaperDesign["arrangement"];
  order: NewspaperDesign["order"];
  cover: string;
  isDark: boolean;
  /** Şablonların okuduğu CSS değişkenleri ve sayfa zemini */
  style: CSSProperties;
}

const TEXT_SCALE = { s: 0.92, m: 1, l: 1.12 } as const;
const GAP_SCALE = { airy: 1.35, cozy: 1, compact: 0.72 } as const;
const PHOTO_MAX = { s: "58%", m: "80%", l: "100%" } as const;

export function resolveDesign(
  design: NewspaperDesign,
  template: TemplateId,
  fallbackTitle: string,
  locale: Locale = "tr",
): ResolvedDesign {
  const t = TEMPLATE_DEFAULTS[template];
  const paletteId: PaletteId = design.palette === "template" ? t.palette : design.palette;
  const p = PALETTES[paletteId];
  const accent = design.accentColor || p.accent;
  const tint = design.accentColor ? mix(p.paper, design.accentColor, 0.12) : p.tint;
  const fonts = FONT_PAIRS[design.fontPair === "template" ? t.fontPair : design.fontPair];
  const paper = PAPERS[design.paper === "template" ? t.paper : design.paper];
  const filter = FILTERS[design.photoFilter === "template" ? t.photoFilter : design.photoFilter];
  const shape: ShapeId = design.photoShape === "template" ? t.photoShape : design.photoShape;
  const cols = design.columns === "template" ? t.columns : Number(design.columns);

  const style = {
    "--np-paper": p.paper,
    "--np-ink": p.ink,
    "--np-muted": p.muted,
    "--np-rule": p.rule,
    "--np-accent": accent,
    "--np-on-accent": readableOn(accent),
    "--np-accent2": p.accent2,
    "--np-on-accent2": readableOn(p.accent2),
    "--np-highlight": p.highlight,
    "--np-on-highlight": readableOn(p.highlight),
    "--np-tint": tint,
    "--np-note1": tint,
    "--np-note2": mix(p.paper, p.highlight, 0.45),
    "--np-note3": mix(p.paper, p.accent2, 0.2),
    "--np-note4": mix(p.paper, accent, 0.16),
    "--np-head": fonts.head,
    "--np-body": fonts.body,
    "--np-head-weight": String(fonts.headWeight),
    "--np-text": String(TEXT_SCALE[design.textSize]),
    "--np-gap": String(GAP_SCALE[design.density]),
    "--np-cols-md": String(Math.min(cols, 2)),
    "--np-cols-lg": String(cols),
    "--np-photo-filter": filter.css,
    "--np-photo-radius": SHAPES[shape].radius,
    "--np-photo-max": PHOTO_MAX[design.photoSize],
    "--np-corner": t.corner,
    "--np-max": t.maxWidth,
    backgroundColor: p.paper,
    color: p.ink,
    fontFamily: fonts.body,
    ...paper.css(rgbList(p.ink), rgbList(accent), rgbList(p.highlight)),
  } as CSSProperties;

  return {
    template,
    locale,
    title: design.mastheadTitle || fallbackTitle,
    tagline: design.tagline || (locale === "en" ? t.taglineEn : t.tagline),
    editorNote: design.editorNote,
    editorSignature: design.editorSignature,
    closingNote: design.closingNote,
    align: design.align === "template" ? t.align : design.align,
    decorations: design.decorations,
    dropCap: design.dropCap,
    show: {
      avatars: design.showAvatars,
      numbers: design.showNumbers,
      contributors: design.showContributors,
      date: design.showDate,
      stats: design.showStats,
    },
    photoShape: shape,
    arrangement: design.arrangement,
    order: design.order,
    cover: design.cover,
    isDark: luminance(p.paper) < 0.2,
    style,
  };
}

// ── İçerik düzeni ─────────────────────────────────────────────────────────

export interface NewsEntry {
  id: string;
  author: NewsPerson;
  /** Kişi kişi düzende yanıtın hangi soruya ait olduğu */
  heading: string | null;
  body: string;
  media: NewsMedia[];
}

export interface NewsSection {
  id: string;
  index: number;
  kind: "question" | "person";
  title: string;
  person: NewsPerson | null;
  entries: NewsEntry[];
}

/** Karışık sıralama her açılışta değişmesin diye kimlikten türetilen sabit bir sayı. */
function stableHash(value: string) {
  let h = 2166136261;
  for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function sortEntries<T extends { id: string; author: NewsPerson }>(
  list: T[],
  order: ResolvedDesign["order"],
  locale: Locale,
): T[] {
  if (order === "name") return [...list].sort((a, b) => a.author.name.localeCompare(b.author.name, INTL_LOCALE[locale]));
  if (order === "shuffle") return [...list].sort((a, b) => stableHash(a.id) - stableHash(b.id));
  return list;
}

export function buildSections(data: NewspaperData, d: ResolvedDesign): NewsSection[] {
  if (d.arrangement === "person") {
    const people = sortEntries(
      data.contributors.map((c) => ({ id: c.id, author: c })),
      d.order,
      d.locale,
    );
    return people
      .map(({ author }, index) => ({
        id: `kisi-${author.id}`,
        index,
        kind: "person" as const,
        title: author.name,
        person: author,
        entries: data.questions.flatMap((q) =>
          q.answers
            .filter((a) => a.author.id === author.id)
            .map((a) => ({ id: a.id, author: a.author, heading: q.text, body: a.body, media: a.media })),
        ),
      }))
      .filter((s) => s.entries.length);
  }
  return data.questions.map((q, index) => ({
    id: q.id,
    index,
    kind: "question" as const,
    title: q.text,
    person: null,
    entries: sortEntries(
      q.answers.map((a) => ({ id: a.id, author: a.author, heading: null, body: a.body, media: a.media })),
      d.order,
      d.locale,
    ),
  }));
}

export function allPhotos(data: NewspaperData): NewsMedia[] {
  return data.questions.flatMap((q) => q.answers.flatMap((a) => a.media.filter((m) => m.kind === "image" && m.src)));
}

export function pickCover(data: NewspaperData, d: ResolvedDesign): NewsMedia | null {
  if (d.cover === "none") return null;
  const photos = allPhotos(data);
  if (d.cover !== "auto") {
    const chosen = photos.find((m) => m.id === d.cover);
    if (chosen) return chosen;
  }
  return TEMPLATE_DEFAULTS[d.template].autoCover ? (photos[0] ?? null) : null;
}

// ── "Bana sürpriz yap" ────────────────────────────────────────────────────

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

/** Rastgele ama uyumlu bir tasarım (metinleri ve seçili kapağı korur). */
export function randomDesign(current: NewspaperDesign): NewspaperDesign {
  return {
    ...current,
    palette: pick(ids(PALETTES)),
    accentColor: "",
    fontPair: pick(ids(FONT_PAIRS)),
    paper: pick(ids(PAPERS)),
    photoFilter: pick(ids(FILTERS)),
    photoShape: pick(ids(SHAPES)),
    align: pick(["center", "left"] as const),
    decorations: pick(["some", "lots"] as const),
    density: pick(["airy", "cozy", "compact"] as const),
  };
}
