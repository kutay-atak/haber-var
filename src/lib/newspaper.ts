// Gazete şablonlarının ortak veri biçimi. Şablonlar veritabanını ya da
// Cloudinary'yi bilmez; her şey burada hazır gelir (önizleme sayfası da bunu kullanır).

export interface NewsPerson {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface NewsMedia {
  id: string;
  kind: "image" | "video";
  /** Görsel ya da video adresi. Önizlemedeki örnek videolarda null. */
  src: string | null;
  srcSet?: string;
  poster?: string;
  width: number | null;
  height: number | null;
  /** Basılı sayfada videoya ulaşmak için QR kodu (SVG). */
  qrSvg?: string;
}

export interface NewsAnswer {
  id: string;
  author: NewsPerson;
  body: string;
  media: NewsMedia[];
}

export interface NewsQuestion {
  id: string;
  text: string;
  answers: NewsAnswer[];
}

export interface NewspaperData {
  groupName: string;
  issueNumber: number;
  issueTitle: string | null;
  publishedAt: string;
  contributors: NewsPerson[];
  questions: NewsQuestion[];
  stats: { answers: number; photos: number; videos: number };
}

/** Uzun metinden alıntı için ilk cümleyi (en fazla ~140 karakter) çıkarır. */
export function pullQuote(text: string): string | null {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 25) return null;
  const sentence = clean.match(/^(.{20,140}?[.!?…])(\s|$)/)?.[1];
  if (sentence) return sentence;
  return clean.length <= 140 ? clean : `${clean.slice(0, 137).trimEnd()}…`;
}

export function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function firstImage(data: NewspaperData): NewsMedia | null {
  for (const q of data.questions) {
    for (const a of q.answers) {
      const img = a.media.find((m) => m.kind === "image" && m.src);
      if (img) return img;
    }
  }
  return null;
}
