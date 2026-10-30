// Gazete şablonlarının ortak veri biçimi. Şablonlar veritabanını ya da
// Cloudinary'yi bilmez; her şey burada hazır gelir (önizleme sayfası da bunu kullanır).
import type { QuestionKind } from "@/lib/types";

export interface NewsPerson {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface NewsMedia {
  id: string;
  kind: "image" | "video" | "audio";
  /** Görsel, video ya da ses adresi. Önizlemedeki örneklerde null. */
  src: string | null;
  srcSet?: string;
  poster?: string;
  width: number | null;
  height: number | null;
  /** Basılı sayfada videoya ya da sese ulaşmak için QR kodu (SVG). */
  qrSvg?: string;
  /** Video ya da sesli notun süresi (saniye) */
  duration?: number | null;
}

export interface NewsAnswer {
  id: string;
  author: NewsPerson;
  body: string;
  media: NewsMedia[];
}

/** Anketin bir seçeneği ya da "kim daha çok?" sorusunda oy alan kişi. */
export interface VoteOption {
  label: string;
  votes: number;
  /** Ankette bu seçeneği seçenler (WhatsApp anketleri gibi görünür). "Kim daha çok?" oyları gizlidir. */
  voters: NewsPerson[];
  /** "Kim daha çok?" sorusunda oy alan kişi */
  person?: NewsPerson;
}

export interface VoteResults {
  kind: "poll" | "who";
  /** Toplam oy */
  total: number;
  /** Anket: seçenek sırasıyla. "Kim daha çok?": en çok oy alandan aza, sadece oy alanlar. */
  options: VoteOption[];
}

export interface NewsQuestion {
  id: string;
  text: string;
  answers: NewsAnswer[];
  kind?: QuestionKind;
  /** Soruyu sıraya ekleyen editör */
  askedBy?: NewsPerson | null;
  /** Anket ve "kim daha çok?" sonuçları */
  vote?: VoteResults | null;
}

export interface NewspaperData {
  groupName: string;
  issueNumber: number;
  issueTitle: string | null;
  publishedAt: string;
  contributors: NewsPerson[];
  questions: NewsQuestion[];
  stats: { answers: number; photos: number; videos: number; audios: number; votes: number };
}

/** Uzun metinden alıntı için ilk cümleyi (en fazla ~140 karakter) çıkarır. */
export function pullQuote(text: string): string | null {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length < 25) return null;
  const sentence = clean.match(/^(.{20,140}?[.!?…])(\s|$)/)?.[1];
  if (sentence) return sentence;
  return clean.length <= 140 ? clean : `${clean.slice(0, 137).trimEnd()}…`;
}

/** Metni ilk cümle (büyük alıntı) ve devamı olarak ikiye böler. */
export function splitLead(text: string): { lead: string; rest: string } {
  const clean = text.trim();
  const match = clean.match(/^([\s\S]{20,160}?[.!?…])(\s+|$)/);
  if (match) return { lead: match[1], rest: clean.slice(match[0].length).trim() };
  return clean.length <= 180 ? { lead: clean, rest: "" } : { lead: "", rest: clean };
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
