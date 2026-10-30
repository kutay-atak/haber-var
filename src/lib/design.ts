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
import type { NewsMedia, NewsPerson, NewspaperData, VoteResults } from "@/lib/newspaper";
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
  /** Gazetenin adı: şablonun yazı tipiyle ya da eski gazetelerdeki gibi gotik harflerle */
  mastheadFont: z.enum(["template", "gothic"]).catch("template"),
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
  /** "mosaic": sorular gazete sayfasındaki gibi yan yana, büyüklüklerine göre farklı genişlikte */
  pageLayout: z.enum(["stacked", "mosaic"]).catch("stacked"),
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
  mastheadFont: NewspaperDesign["mastheadFont"];
  align: "center" | "left";
  decorations: NewspaperDesign["decorations"];
  dropCap: boolean;
  show: { avatars: boolean; numbers: boolean; contributors: boolean; date: boolean; stats: boolean };
  photoShape: ShapeId;
  /** Seçilen (ya da şablonun) yazı sütunu sayısı */
  columns: number;
  pageLayout: NewspaperDesign["pageLayout"];
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
    mastheadFont: design.mastheadFont,
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
    columns: cols,
    pageLayout: design.pageLayout,
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
  /** Anket ve "kim daha çok?" sonuçları; varsa yanıtlar yerine grafik gösterilir. */
  vote: VoteResults | null;
  /** Soruyu sıraya ekleyen editör */
  askedBy: NewsPerson | null;
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
  const questionSection = (q: NewspaperData["questions"][number], index: number): NewsSection => ({
    id: q.id,
    index,
    kind: "question",
    title: q.text,
    person: null,
    entries: sortEntries(
      q.answers.map((a) => ({ id: a.id, author: a.author, heading: null, body: a.body, media: a.media })),
      d.order,
      d.locale,
    ),
    vote: q.vote ?? null,
    askedBy: q.askedBy ?? null,
  });

  if (d.arrangement === "person") {
    const people = sortEntries(
      data.contributors.map((c) => ({ id: c.id, author: c })),
      d.order,
      d.locale,
    );
    const columns: NewsSection[] = people
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
        vote: null,
        askedBy: null,
      }))
      .filter((s) => s.entries.length);
    // Anketler kişiye ait değil: köşe yazılarından sonra ayrı bölümler olarak gelir.
    const polls = data.questions.filter((q) => q.vote).map((q, i) => questionSection(q, columns.length + i));
    return [...columns, ...polls];
  }
  return data.questions.map(questionSection);
}

// ── Gazete sayfası düzeni ─────────────────────────────────────────────────
// Bölümler 6 sütunlu bir ızgaraya yerleşir: manşet geniş açılır, kısa sorular
// dar kalıp yan yana dizilir, satırlar her zaman tam dolar. Telefonda tek sütun.

const MOSAIC_GRID = 6;

export interface MosaicCell {
  /** 6 sütunlu ızgarada kapladığı sütun */
  span: number;
  /** Satırın ilk öğesi mi (solunda ayırıcı çizgi olmaz) */
  rowStart: boolean;
  /** Bölümün içindeki yazı sütunu sayısı */
  cols: number;
}

/** Bölümün kabaca ne kadar yer tuttuğu (karakter cinsinden; fotoğraf ve grafikler de sayılır). */
function sectionWeight(s: NewsSection): number {
  if (s.vote) return s.vote.kind === "who" ? 900 : 600 + s.vote.options.length * 80;
  const content = s.entries.reduce(
    (sum, e) =>
      sum +
      140 +
      e.body.length +
      (e.heading?.length ?? 0) +
      e.media.reduce((m, x) => m + (x.kind === "audio" ? 250 : 650), 0),
    0,
  );
  return Math.max(content, 150);
}

/** Satır içindeki pay: kısa 2, orta 3, uzun 4 sütun ister; çok uzun bölüm tek başına bir satırdır. */
function preferredSpan(weight: number): number {
  if (weight >= 2400) return MOSAIC_GRID;
  if (weight >= 1200) return 4;
  if (weight >= 500) return 3;
  return 2;
}

/** Bir satırdaki 6 sütunu içerik miktarına göre paylaştırır (her bölüm en az 2, manşet en az 3 sütun). */
function shareRow(weights: number[], startsWithLead: boolean): number[] {
  if (weights.length === 1) return [MOSAIC_GRID];
  if (weights.length === 3) return [2, 2, 2];
  const share = Math.round((MOSAIC_GRID * weights[0]) / (weights[0] + weights[1]));
  const first = Math.min(Math.max(share, startsWithLead ? 3 : 2), 4);
  return [first, MOSAIC_GRID - first];
}

/** "Gazete sayfası gibi" düzende her bölümün yeri; alt alta düzende null. */
export function mosaicCells(sections: NewsSection[], d: ResolvedDesign): MosaicCell[] | null {
  if (d.pageLayout !== "mosaic" || sections.length < 2) return null;
  // Manşet biraz daha fazla yer alsın.
  const weights = sections.map((s, i) => sectionWeight(s) * (i === 0 ? 1.6 : 1));
  const rows: number[][] = [];
  let row: number[] = [];
  const flush = () => {
    if (row.length) rows.push(row);
    row = [];
  };

  weights.forEach((weight, i) => {
    if (preferredSpan(weight) === MOSAIC_GRID) {
      flush();
      rows.push([i]);
      return;
    }
    row.push(i);
    const wanted = row.reduce((sum, j) => sum + preferredSpan(weights[j]), 0);
    if (row.length === 3 || wanted >= MOSAIC_GRID) flush();
  });
  flush();

  const cells: MosaicCell[] = [];
  let previousEven = false;
  for (const r of rows) {
    const spans = shareRow(
      r.map((j) => weights[j]),
      r[0] === 0,
    );
    // Art arda iki satır da ikiye eşit bölünmesin: ikincide büyük olan 4, küçük olan 2 sütun alır.
    const even = spans.length === 2 && spans[0] === 3;
    if (even && previousEven && r[0] !== 0) {
      const bigger = weights[r[0]] >= weights[r[1]] ? 0 : 1;
      spans[bigger] = 4;
      spans[1 - bigger] = 2;
    }
    previousEven = spans.length === 2 && spans[0] === 3;
    spans.forEach((span, k) => {
      cells[r[k]] = {
        span,
        rowStart: k === 0,
        cols: span >= MOSAIC_GRID ? d.columns : span >= 4 ? Math.min(d.columns, 2) : 1,
      };
    });
  }
  return cells;
}

// ── Ön sayfa (klasik şablon + gazete sayfası düzeni) ─────────────────────
// Gerçek bir gazetenin birinci sayfası gibi: ortada fotoğraflı manşet, iki yanda
// dar sütunlarda birer haber, en üstte içerideki haberlere götüren kısa tanıtımlar.

export interface FrontPage {
  lead: NewsSection;
  /** Manşetin iki yanındaki dar sütunlar (0-2 bölüm) */
  rails: NewsSection[];
  /** Ön sayfadan sonra gelen bölümler, kendi sıralarıyla */
  rest: NewsSection[];
  /** En üstteki tanıtımlar (en fazla 3, kalan bölümlerden) */
  teasers: NewsSection[];
}

const hasPhoto = (s: NewsSection) => s.entries.some((e) => e.media.some((m) => m.kind === "image" && m.src));
const hasMedia = (s: NewsSection) => s.entries.some((e) => e.media.length > 0);

export function frontPage(sections: NewsSection[]): FrontPage | null {
  const stories = sections.filter((s) => !s.vote && s.entries.length);
  if (stories.length < 2) return null;
  // Manşet: fotoğrafı olanlardan en dolu bölüm (yoksa en dolu bölüm).
  const byWeight = [...stories].sort((a, b) => sectionWeight(b) - sectionWeight(a));
  const lead = byWeight.find(hasPhoto) ?? byWeight[0];
  // Yan sütunlar: sırayla, önce fotoğrafsız (yazı ağırlıklı) bölümler.
  const others = stories.filter((s) => s !== lead);
  const rails = [...others.filter((s) => !hasMedia(s)), ...others.filter(hasMedia)]
    .slice(0, 2)
    .sort((a, b) => a.index - b.index);
  const rest = sections.filter((s) => s !== lead && !rails.includes(s));
  const teasers = [...rest.filter(hasPhoto), ...rest.filter((s) => !hasPhoto(s))].slice(0, 3).sort((a, b) => a.index - b.index);
  return { lead, rails, rest, teasers };
}

/** Bölümün yanıtlarından manşet altına uygun bir cümle ve yazarı. */
export function pullQuote(s: NewsSection): { text: string; author: NewsPerson } | null {
  for (const e of [...s.entries].sort((a, b) => b.body.length - a.body.length)) {
    const sentences = e.body.replace(/\s+/g, " ").trim().split(/(?<=[.!?…])\s+/);
    const pick = sentences.find((x) => x.length >= 30 && x.length <= 120);
    if (pick) return { text: pick.replace(/[.…]+$/, ""), author: e.author };
  }
  return null;
}

/** Bölümün ilk fotoğrafı (manşet ve tanıtım görselleri için). */
export function firstPhoto(s: NewsSection): NewsMedia | null {
  for (const e of s.entries) {
    const photo = e.media.find((m) => m.kind === "image" && m.src);
    if (photo) return photo;
  }
  return null;
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
