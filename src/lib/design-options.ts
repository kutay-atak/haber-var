import type { TemplateId } from "@/lib/types";

// Gazete tasarım stüdyosundaki tüm seçenekler. Yeni bir palet, yazı tipi ya da
// doku eklemek için buraya bir satır eklemen yeterli; stüdyo otomatik gösterir.

export interface Palette {
  name: string;
  /** Sayfa zemini */
  paper: string;
  /** Ana yazı rengi */
  ink: string;
  /** İkincil yazılar (tarih, imza…) */
  muted: string;
  /** Çizgiler ve kenarlıklar */
  rule: string;
  /** Vurgu rengi (başlıklar, etiketler); zemin üzerinde okunabilir */
  accent: string;
  /** İkinci vurgu rengi; zemin üzerinde okunabilir */
  accent2: string;
  /** Süsleme rengi (fosforlu kalem, bant, çıkartma); yazı için değil */
  highlight: string;
  /** Kart zemini */
  tint: string;
}

// Yazı/zemin çiftleri WCAG AA kontrastını (≥ 4.5) sağlayacak şekilde seçildi.
export const PALETTES = {
  terracotta: { name: "Terrakota", paper: "#fffdf9", ink: "#3d405b", muted: "#64677f", rule: "#ecdccb", accent: "#b4523a", accent2: "#3e7558", highlight: "#f2cc8f", tint: "#fbefe7" },
  gazete: { name: "Gazete kâğıdı", paper: "#fbf7ee", ink: "#23242f", muted: "#5b5b66", rule: "#cfc5b3", accent: "#23242f", accent2: "#8a2c22", highlight: "#e9dfc8", tint: "#f2ecdf" },
  defter: { name: "Defter", paper: "#f7efe1", ink: "#3a3346", muted: "#635c70", rule: "#d9cbb3", accent: "#b24c31", accent2: "#3f6f57", highlight: "#f2cc8f", tint: "#fff4b0" },
  murekkep: { name: "Mürekkep", paper: "#fbf6ea", ink: "#24324f", muted: "#55607a", rule: "#dcd3bf", accent: "#ab3428", accent2: "#2b628c", highlight: "#e8c87a", tint: "#f3ecdb" },
  okyanus: { name: "Okyanus", paper: "#f4f8fb", ink: "#1d3346", muted: "#4f6577", rule: "#d3e2ee", accent: "#25628f", accent2: "#2f7a72", highlight: "#a8d0e6", tint: "#e3eef6" },
  orman: { name: "Orman", paper: "#f5f7f0", ink: "#22311f", muted: "#55644f", rule: "#d6e0cc", accent: "#3b6637", accent2: "#8a6514", highlight: "#e3c567", tint: "#e6eedc" },
  lavanta: { name: "Lavanta", paper: "#faf7fd", ink: "#352a4a", muted: "#675e7b", rule: "#e6def2", accent: "#6e4f9e", accent2: "#a84471", highlight: "#f3b6cf", tint: "#efe8f8" },
  gunbatimi: { name: "Gün batımı", paper: "#fff6ef", ink: "#3b2430", muted: "#76575f", rule: "#f1d6c6", accent: "#c2402a", accent2: "#a35b14", highlight: "#f7b267", tint: "#fde6d8" },
  seker: { name: "Pamuk şeker", paper: "#fff7fb", ink: "#3a2b3f", muted: "#74627a", rule: "#f4d5e5", accent: "#b9357a", accent2: "#1e7d82", highlight: "#8fe3e6", tint: "#fde4f0" },
  kahve: { name: "Kahve", paper: "#f6f0e7", ink: "#3b2a20", muted: "#6c584a", rule: "#e2d2bf", accent: "#86553a", accent2: "#8a5d33", highlight: "#e0c097", tint: "#ece2d4" },
  nane: { name: "Nane", paper: "#f3fbf7", ink: "#1f3a33", muted: "#4d6a62", rule: "#cfe8dd", accent: "#1d7461", accent2: "#b14f35", highlight: "#f4a988", tint: "#ddf2e9" },
  retro: { name: "Retro", paper: "#fbf0dc", ink: "#3d2b1f", muted: "#6d5644", rule: "#ead2ac", accent: "#a84716", accent2: "#2f7565", highlight: "#e8a33d", tint: "#f6dfb5" },
  bulvar: { name: "Bulvar", paper: "#ffffff", ink: "#111111", muted: "#4a4a4a", rule: "#d9d9d9", accent: "#c81e1e", accent2: "#8a6a00", highlight: "#ffd60a", tint: "#fff3c2" },
  gece: { name: "Gece", paper: "#151823", ink: "#f1eee6", muted: "#a7aabb", rule: "#2c3143", accent: "#f2cc8f", accent2: "#f08a6c", highlight: "#f2cc8f", tint: "#1e2231" },
  siyahbeyaz: { name: "Siyah-beyaz", paper: "#ffffff", ink: "#111111", muted: "#555555", rule: "#dddddd", accent: "#111111", accent2: "#666666", highlight: "#e5e5e5", tint: "#f3f3f3" },
} satisfies Record<string, Palette>;

export type PaletteId = keyof typeof PALETTES;

export interface FontPair {
  name: string;
  head: string;
  body: string;
  /** Başlık yazı tipinin gerçekten sahip olduğu kalınlık (sahte kalınlaştırma olmasın diye). */
  headWeight: number;
}

// Font değişkenleri src/components/newspaper/fonts.ts dosyasında yükleniyor.
export const FONT_PAIRS = {
  klasik: { name: "Klasik", head: "var(--font-playfair), Georgia, serif", body: "var(--font-newsreader), Georgia, serif", headWeight: 800 },
  zarif: { name: "Zarif", head: "var(--font-dmserif), Georgia, serif", body: "var(--font-nunito), system-ui, sans-serif", headWeight: 400 },
  yumusak: { name: "Yumuşak", head: "var(--font-fraunces), Georgia, serif", body: "var(--font-nunito), system-ui, sans-serif", headWeight: 600 },
  defter: { name: "El yazısı", head: "var(--font-caveat), cursive", body: "var(--font-patrick), cursive", headWeight: 700 },
  mektup: { name: "Mektup", head: "var(--font-dancing), cursive", body: "var(--font-lora), Georgia, serif", headWeight: 700 },
  edebi: { name: "Edebî", head: "var(--font-cormorant), Georgia, serif", body: "var(--font-garamond), Georgia, serif", headWeight: 600 },
  sade: { name: "Sade", head: "var(--font-inter), system-ui, sans-serif", body: "var(--font-inter), system-ui, sans-serif", headWeight: 800 },
  cagdas: { name: "Çağdaş", head: "var(--font-bricolage), system-ui, sans-serif", body: "var(--font-dmsans), system-ui, sans-serif", headWeight: 700 },
  daktilo: { name: "Daktilo", head: "var(--font-specialelite), monospace", body: "var(--font-courier), monospace", headWeight: 400 },
  bulvar: { name: "Bulvar", head: "var(--font-anton), Impact, sans-serif", body: "var(--font-franklin), system-ui, sans-serif", headWeight: 400 },
  retro: { name: "Retro", head: "var(--font-shrikhand), cursive", body: "var(--font-rubik), system-ui, sans-serif", headWeight: 400 },
  neseli: { name: "Neşeli", head: "var(--font-fredoka), system-ui, sans-serif", body: "var(--font-nunito), system-ui, sans-serif", headWeight: 600 },
} satisfies Record<string, FontPair>;

export type FontPairId = keyof typeof FONT_PAIRS;

// Kâğıt dokuları. "c" yazı renginin RGB değeri, "a"/"b" vurgu renkleri (rgb(... / alfa) için).
export const PAPERS = {
  duz: { name: "Düz", css: () => ({}) },
  nokta: {
    name: "Noktalı",
    css: (c: string) => ({ backgroundImage: `radial-gradient(rgb(${c} / 0.11) 1px, transparent 1.3px)`, backgroundSize: "18px 18px" }),
  },
  cizgi: {
    name: "Çizgili",
    css: (c: string) => ({
      backgroundImage: `repeating-linear-gradient(transparent 0 31px, rgb(${c} / 0.1) 31px 32px)`,
    }),
  },
  kare: {
    name: "Kareli",
    css: (c: string) => ({
      backgroundImage: `linear-gradient(rgb(${c} / 0.07) 1px, transparent 1px), linear-gradient(90deg, rgb(${c} / 0.07) 1px, transparent 1px)`,
      backgroundSize: "24px 24px",
    }),
  },
  keten: {
    name: "Keten",
    css: (c: string) => ({
      backgroundImage: `repeating-linear-gradient(45deg, rgb(${c} / 0.035) 0 2px, transparent 2px 6px), repeating-linear-gradient(-45deg, rgb(${c} / 0.035) 0 2px, transparent 2px 6px)`,
    }),
  },
  kraft: {
    name: "Kraft",
    css: (c: string) => ({
      backgroundImage: `repeating-radial-gradient(circle at 17% 32%, rgb(${c} / 0.03) 0 1px, transparent 1px 5px), repeating-linear-gradient(90deg, rgb(${c} / 0.025) 0 1px, transparent 1px 7px)`,
    }),
  },
  eski: {
    name: "Eskimiş",
    css: () => ({ backgroundImage: "radial-gradient(ellipse at center, transparent 50%, rgb(120 90 40 / 0.2) 100%)" }),
  },
  konfeti: {
    name: "Konfeti",
    css: (c: string, a: string, b: string) => ({
      backgroundImage: `radial-gradient(circle at 12% 18%, rgb(${a} / 0.45) 0 3px, transparent 3.5px), radial-gradient(circle at 68% 62%, rgb(${b} / 0.55) 0 2.5px, transparent 3px), radial-gradient(circle at 38% 84%, rgb(${c} / 0.16) 0 2px, transparent 2.5px), radial-gradient(circle at 88% 12%, rgb(${b} / 0.4) 0 2px, transparent 2.5px)`,
      backgroundSize: "150px 150px",
    }),
  },
} satisfies Record<string, { name: string; css: (ink: string, accent: string, highlight: string) => Record<string, string> }>;

export type PaperId = keyof typeof PAPERS;

export const FILTERS = {
  renkli: { name: "Renkli", css: "none" },
  siyahbeyaz: { name: "Siyah-beyaz", css: "grayscale(1) contrast(1.06)" },
  sepya: { name: "Sepya", css: "sepia(0.65) contrast(1.02)" },
  vintage: { name: "Vintage", css: "sepia(0.3) contrast(0.92) brightness(1.06) saturate(0.85)" },
  sicak: { name: "Sıcak", css: "saturate(1.15) sepia(0.12) brightness(1.03)" },
  soguk: { name: "Soğuk", css: "saturate(0.9) hue-rotate(12deg) brightness(1.02)" },
  soluk: { name: "Soluk", css: "contrast(0.82) brightness(1.1) saturate(0.75)" },
  canli: { name: "Canlı", css: "saturate(1.35) contrast(1.08)" },
  dram: { name: "Dramatik", css: "contrast(1.25) saturate(0.9) brightness(0.95)" },
} satisfies Record<string, { name: string; css: string }>;

export type FilterId = keyof typeof FILTERS;

export const SHAPES = {
  keskin: { name: "Keskin köşe", radius: "0px" },
  yumusak: { name: "Hafif oval", radius: "8px" },
  yuvarlak: { name: "Yuvarlak", radius: "22px" },
  kemer: { name: "Kemer", radius: "50% 50% 14px 14px / 34% 34% 14px 14px" },
  polaroid: { name: "Polaroid", radius: "0px" },
  pul: { name: "Posta pulu", radius: "0px" },
} satisfies Record<string, { name: string; radius: string }>;

export type ShapeId = keyof typeof SHAPES;

export interface TemplateDefaults {
  palette: PaletteId;
  fontPair: FontPairId;
  paper: PaperId;
  photoFilter: FilterId;
  photoShape: ShapeId;
  columns: 1 | 2 | 3;
  align: "center" | "left";
  /** Kapak fotoğrafı "otomatik" iken kapak gösterilsin mi? */
  autoCover: boolean;
  tagline: string;
  /** Sayfanın köşe yuvarlaklığı ve en fazla genişliği */
  corner: string;
  maxWidth: string;
}

export const TEMPLATE_DEFAULTS: Record<TemplateId, TemplateDefaults> = {
  classic: { palette: "gazete", fontPair: "klasik", paper: "duz", photoFilter: "siyahbeyaz", photoShape: "keskin", columns: 3, align: "center", autoCover: false, tagline: "Uzaktaki dostların gündemi", corner: "4px", maxWidth: "72rem" },
  magazine: { palette: "terracotta", fontPair: "zarif", paper: "duz", photoFilter: "renkli", photoShape: "yuvarlak", columns: 2, align: "left", autoCover: true, tagline: "Bu ayın en güzel hikâyeleri", corner: "2rem", maxWidth: "72rem" },
  scrapbook: { palette: "defter", fontPair: "defter", paper: "cizgi", photoFilter: "renkli", photoShape: "polaroid", columns: 2, align: "center", autoCover: false, tagline: "defterinden notlar", corner: "1.5rem", maxWidth: "64rem" },
  letter: { palette: "murekkep", fontPair: "mektup", paper: "keten", photoFilter: "vintage", photoShape: "pul", columns: 1, align: "left", autoCover: false, tagline: "Uzaklardan sevgilerle", corner: "1rem", maxWidth: "52rem" },
  album: { palette: "kahve", fontPair: "edebi", paper: "duz", photoFilter: "renkli", photoShape: "yumusak", columns: 3, align: "center", autoCover: true, tagline: "Bu ayın kareleri", corner: "1.5rem", maxWidth: "72rem" },
  minimal: { palette: "siyahbeyaz", fontPair: "sade", paper: "duz", photoFilter: "renkli", photoShape: "keskin", columns: 1, align: "left", autoCover: true, tagline: "Kısa, sade, öz", corner: "0px", maxWidth: "52rem" },
  night: { palette: "gece", fontPair: "cagdas", paper: "nokta", photoFilter: "renkli", photoShape: "yumusak", columns: 2, align: "left", autoCover: true, tagline: "Gece yarısı baskısı", corner: "1.5rem", maxWidth: "72rem" },
  tabloid: { palette: "bulvar", fontPair: "bulvar", paper: "duz", photoFilter: "canli", photoShape: "keskin", columns: 3, align: "center", autoCover: true, tagline: "Gündemi biz belirleriz!", corner: "0px", maxWidth: "72rem" },
  retro: { palette: "retro", fontPair: "retro", paper: "kraft", photoFilter: "sicak", photoShape: "yuvarlak", columns: 2, align: "center", autoCover: true, tagline: "70'lerden beri sizinle", corner: "2rem", maxWidth: "68rem" },
};
