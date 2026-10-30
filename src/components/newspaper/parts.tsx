import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { mosaicCells, type NewsEntry, type NewsSection, type ResolvedDesign } from "@/lib/design";
import { formatDate } from "@/lib/format";
import { hyphenateTr } from "@/lib/hyphenate";
import { translator } from "@/lib/i18n";
import { paragraphs, type NewsMedia, type NewsPerson, type NewspaperData } from "@/lib/newspaper";
import { cn } from "@/lib/utils";
import { NewsAudio, NewsImage, NewsVideo } from "./media";

// Dokuz şablonun ortak parçaları. Görünüm (renk, yazı tipi, fotoğraf stili)
// CSS değişkenlerinden gelir; şablonlar bu parçaları kendi düzenlerine yerleştirir.

export interface TemplateProps {
  data: NewspaperData;
  sections: NewsSection[];
  d: ResolvedDesign;
  cover: NewsMedia | null;
}

/** Gazetenin seçili dildeki sabit metinleri için: tx(d)("Türkçe", "English"). */
export const tx = (d: ResolvedDesign) => translator(d.locale);

/**
 * Bölümleri sarar. Varsayılan düzende hiçbir şey değiştirmez; tasarımda
 * "gazete sayfası gibi" seçildiyse her bölüm ızgarada kendi genişliğini alır
 * ve içindeki yazı sütunu sayısı bu genişliğe göre ayarlanır.
 */
export function SectionGrid({ sections, d, children }: { sections: NewsSection[]; d: ResolvedDesign; children: ReactNode }) {
  const cells = mosaicCells(sections, d);
  if (!cells) return <>{children}</>;
  return (
    <div className="np-mosaic">
      {Children.toArray(children).map((child, i) => {
        const full = { span: 6, rowStart: true, cols: d.columns };
        const cell = cells[i] ?? { ...full, print: full };
        const style = {
          "--np-span": String(cell.span),
          "--np-cols-lg": String(cell.cols),
          "--np-cols-md": String(Math.min(cell.cols, 2)),
          "--np-span-print": String(cell.print.span),
          "--np-cols-print": String(cell.print.cols),
        } as CSSProperties;
        return (
          <div
            key={isValidElement(child) && child.key !== null ? child.key : i}
            className={cn("np-cell", !cell.rowStart && "np-cell-rule", !cell.print.rowStart && "np-cell-rule-print")}
            style={style}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}

/** Kart dizilimlerinde kart sayısı: sütun sayısı bunu aşmaz (bkz. globals.css → np-grid). */
export const cardCount = (n: number) => ({ "--np-n": String(Math.max(n, 1)) }) as CSSProperties;

/** Künye satırı için: "4 yazar" / "4 contributors". */
export function contributorCount(data: NewspaperData, d: ResolvedDesign) {
  const n = data.contributors.length;
  return tx(d)(`${n} yazar`, n === 1 ? "1 contributor" : `${n} contributors`);
}

/** "Sayı 7 · 25 Ekim 2026" (tarih gizlenebilir). */
export function issueMeta(data: NewspaperData, d: ResolvedDesign, sep = " · ") {
  const t = tx(d);
  return [`${t("Sayı", "Issue")} ${data.issueNumber}`, d.show.date ? formatDate(data.publishedAt, d.locale) : null]
    .filter(Boolean)
    .join(sep);
}

export function statsText(data: NewspaperData, d: ResolvedDesign) {
  const t = tx(d);
  const { answers, photos, videos, audios, votes } = data.stats;
  const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
  return [
    answers ? n(answers, t("yazı", "story"), t("yazı", "stories")) : null,
    photos ? n(photos, t("fotoğraf", "photo"), t("fotoğraf", "photos")) : null,
    videos ? n(videos, "video", t("video", "videos")) : null,
    audios ? n(audios, t("sesli not", "voice note"), t("sesli not", "voice notes")) : null,
    votes ? n(votes, t("oy", "vote"), t("oy", "votes")) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** "Soran: Ayşe" (soruyu editör önerdiyse) */
export function askedByText(section: NewsSection, d: ResolvedDesign) {
  return section.askedBy ? tx(d)(`Soran: ${section.askedBy.name}`, `Asked by ${section.askedBy.name}`) : null;
}

/** Bölümün küçük üst etiketi: "Soru 2" ya da kişi kişi düzende "Köşe yazısı". Editörün sorusuysa soranın adı eklenir. */
export function sectionLabel(section: NewsSection, d: ResolvedDesign, firstLabel?: string) {
  const t = tx(d);
  if (section.kind === "person") return t("Köşe yazısı", "Column");
  const base = section.index === 0 && firstLabel ? firstLabel : d.show.numbers ? `${t("Soru", "Question")} ${section.index + 1}` : null;
  return [base, askedByText(section, d)].filter(Boolean).join(" · ") || null;
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export function Byline({
  author,
  d,
  size = "xs",
  className,
  prefix,
  suffix,
}: {
  author: NewsPerson;
  d: ResolvedDesign;
  size?: "xs" | "sm" | "md";
  className?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
}) {
  // Kişi kişi düzende bölümün başlığı zaten bu kişinin adı.
  if (d.arrangement === "person") return null;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {d.show.avatars ? <Avatar name={author.name} src={author.avatarUrl} size={size} /> : null}
      <span>
        {prefix}
        {author.name}
        {suffix}
      </span>
    </span>
  );
}

/** Yanıtın metni; kişi kişi düzende önce hangi soruya yanıt olduğu yazar. */
export function EntryText({
  entry,
  d,
  dropCap = false,
  className,
  headingClassName,
  paragraphClassName,
  hyphenate = false,
}: {
  entry: NewsEntry;
  d: ResolvedDesign;
  dropCap?: boolean;
  className?: string;
  headingClassName?: string;
  paragraphClassName?: string;
  /** Dar, iki yana yaslı sütunlar için Türkçe heceleme */
  hyphenate?: boolean;
}) {
  const paras = paragraphs(entry.body).map((p) => (hyphenate && d.locale === "tr" ? hyphenateTr(p) : p));
  if (!paras.length && !entry.heading) return null;
  return (
    <div className={className}>
      {entry.heading ? <p className={cn("np-head mb-2 leading-snug", headingClassName ?? "text-lg")}>{entry.heading}</p> : null}
      {paras.map((p, i) => (
        <p
          key={i}
          className={cn(
            "np-text whitespace-pre-line text-pretty",
            i > 0 && "mt-3",
            dropCap && d.dropCap && i === 0 && "np-dropcap",
            paragraphClassName,
          )}
        >
          {p}
        </p>
      ))}
    </div>
  );
}

function shapeClass(d: ResolvedDesign) {
  if (d.photoShape === "polaroid") return "np-shape-polaroid";
  if (d.photoShape === "pul") return "np-shape-pul";
  return "";
}

export function Photo({
  media,
  d,
  alt,
  square = false,
  className,
  imgClassName,
  sizes,
  caption,
}: {
  media: NewsMedia;
  d: ResolvedDesign;
  alt: string;
  square?: boolean;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  caption?: ReactNode;
}) {
  return (
    <figure className={cn("np-photo print-avoid-break break-inside-avoid", shapeClass(d), className)}>
      <NewsImage media={media} alt={alt} sizes={sizes} className={cn(square && "aspect-square object-cover", imgClassName)} />
      {caption ? <figcaption className="np-small np-muted mt-1.5">{caption}</figcaption> : null}
    </figure>
  );
}

export function Video({ media, d, className, caption }: { media: NewsMedia; d: ResolvedDesign; className?: string; caption?: ReactNode }) {
  return (
    <figure className={cn("np-photo print-avoid-break break-inside-avoid overflow-hidden", shapeClass(d), className)}>
      <NewsVideo media={media} locale={d.locale} />
      {caption ? <figcaption className="np-small np-muted mt-1.5">{caption}</figcaption> : null}
    </figure>
  );
}

/** Bir yanıtın fotoğrafları (birden fazlaysa ızgara) ve videoları. */
export function EntryMedia({
  entry,
  d,
  className,
  gridClassName,
  sizes,
}: {
  entry: NewsEntry;
  d: ResolvedDesign;
  className?: string;
  gridClassName?: string;
  sizes?: string;
}) {
  const images = entry.media.filter((m) => m.kind === "image");
  const videos = entry.media.filter((m) => m.kind === "video");
  const audios = entry.media.filter((m) => m.kind === "audio");
  if (!images.length && !videos.length && !audios.length) return null;
  const alt = `${tx(d)("Fotoğraf", "Photo")}: ${entry.author.name}`;
  return (
    <div className={cn("np-media space-y-3", className)}>
      {images.length === 1 ? <Photo media={images[0]} d={d} alt={alt} sizes={sizes} /> : null}
      {images.length > 1 ? (
        <div className={cn("grid grid-cols-2 gap-2.5", gridClassName)}>
          {images.map((img) => (
            <Photo key={img.id} media={img} d={d} alt={alt} square sizes="(min-width: 768px) 25vw, 50vw" />
          ))}
        </div>
      ) : null}
      {videos.map((v) => (
        <Video key={v.id} media={v} d={d} />
      ))}
      {audios.map((a) => (
        <NewsAudio key={a.id} media={a} locale={d.locale} />
      ))}
    </div>
  );
}

export function EditorNote({
  d,
  className,
  title,
  titleClassName,
  bodyClassName,
}: {
  d: ResolvedDesign;
  className?: string;
  title?: string;
  titleClassName?: string;
  bodyClassName?: string;
}) {
  if (!d.editorNote) return null;
  const heading = title ?? tx(d)("Editörden", "From the editor");
  return (
    <section className={cn("print-avoid-break", className)}>
      {heading ? <p className={titleClassName ?? "np-small np-accent font-bold uppercase tracking-[0.2em]"}>{heading}</p> : null}
      {paragraphs(d.editorNote).map((p, i) => (
        <p key={i} className={cn("np-text mt-2 whitespace-pre-line text-pretty", bodyClassName)}>
          {p}
        </p>
      ))}
      {d.editorSignature ? <p className="np-head np-accent mt-3 text-xl">— {d.editorSignature}</p> : null}
    </section>
  );
}

export function ClosingNote({ d, className }: { d: ResolvedDesign; className?: string }) {
  if (!d.closingNote) return null;
  return (
    <div className={cn("np-text whitespace-pre-line text-pretty", className)}>
      {d.closingNote}
    </div>
  );
}

export function ContributorNames({ data, d, prefix, className }: { data: NewspaperData; d: ResolvedDesign; prefix?: string; className?: string }) {
  if (!d.show.contributors || !data.contributors.length) return null;
  return (
    <p className={className}>
      {prefix ?? tx(d)("Bu sayıda yazanlar: ", "In this issue: ")}
      {data.contributors.map((c) => c.name).join(", ")}
    </p>
  );
}

export function ContributorChips({ data, d, className, chipClassName }: { data: NewspaperData; d: ResolvedDesign; className?: string; chipClassName?: string }) {
  if (!d.show.contributors || !data.contributors.length) return null;
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {data.contributors.map((c) => (
        <li key={c.id} className={cn("flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5", chipClassName)}>
          <Avatar name={c.name} src={c.avatarUrl} size="xs" />
          <span className="np-small font-semibold">{c.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function EmptySection({ d, className, children }: { d: ResolvedDesign; className?: string; children?: ReactNode }) {
  return (
    <p className={cn("np-muted mt-4 italic", className)}>
      {children ?? tx(d)("Bu soruya bu sayıda kimse yanıt vermedi.", "Nobody answered this question in this issue.")}
    </p>
  );
}
