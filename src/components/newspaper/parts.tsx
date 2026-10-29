import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { NewsEntry, NewsSection, ResolvedDesign } from "@/lib/design";
import { formatDate } from "@/lib/format";
import { paragraphs, type NewsMedia, type NewsPerson, type NewspaperData } from "@/lib/newspaper";
import { cn } from "@/lib/utils";
import { NewsImage, NewsVideo } from "./media";

// Dokuz şablonun ortak parçaları. Görünüm (renk, yazı tipi, fotoğraf stili)
// CSS değişkenlerinden gelir; şablonlar bu parçaları kendi düzenlerine yerleştirir.

export interface TemplateProps {
  data: NewspaperData;
  sections: NewsSection[];
  d: ResolvedDesign;
  cover: NewsMedia | null;
}

/** "Sayı 7 · 25 Ekim 2026" (tarih gizlenebilir). */
export function issueMeta(data: NewspaperData, d: ResolvedDesign, sep = " · ") {
  return [`Sayı ${data.issueNumber}`, d.show.date ? formatDate(data.publishedAt) : null].filter(Boolean).join(sep);
}

export function statsText(data: NewspaperData) {
  const { answers, photos, videos } = data.stats;
  return [`${answers} yazı`, photos ? `${photos} fotoğraf` : null, videos ? `${videos} video` : null]
    .filter(Boolean)
    .join(" · ");
}

/** Bölümün küçük üst etiketi: "Soru 2" ya da kişi kişi düzende "Köşe yazısı". */
export function sectionLabel(section: NewsSection, d: ResolvedDesign, firstLabel?: string) {
  if (section.kind === "person") return "Köşe yazısı";
  if (section.index === 0 && firstLabel) return firstLabel;
  return d.show.numbers ? `Soru ${section.index + 1}` : null;
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
}: {
  entry: NewsEntry;
  d: ResolvedDesign;
  dropCap?: boolean;
  className?: string;
  headingClassName?: string;
  paragraphClassName?: string;
}) {
  const paras = paragraphs(entry.body);
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
      <NewsVideo media={media} />
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
  if (!images.length && !videos.length) return null;
  const alt = `Fotoğraf: ${entry.author.name}`;
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
    </div>
  );
}

export function EditorNote({
  d,
  className,
  title = "Editörden",
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
  return (
    <section className={cn("print-avoid-break", className)}>
      {title ? <p className={titleClassName ?? "np-small np-accent font-bold uppercase tracking-[0.2em]"}>{title}</p> : null}
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

export function ContributorNames({ data, d, prefix = "Bu sayıda yazanlar: ", className }: { data: NewspaperData; d: ResolvedDesign; prefix?: string; className?: string }) {
  if (!d.show.contributors || !data.contributors.length) return null;
  return (
    <p className={className}>
      {prefix}
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

export function EmptySection({ className, children = "Bu soruya bu sayıda kimse yanıt vermedi." }: { className?: string; children?: ReactNode }) {
  return <p className={cn("np-muted mt-4 italic", className)}>{children}</p>;
}
