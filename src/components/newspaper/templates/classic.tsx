import { firstPhoto, frontPage, pullQuote, type NewsSection, type ResolvedDesign } from "@/lib/design";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Byline,
  ClosingNote,
  ContributorNames,
  EditorNote,
  EmptySection,
  EntryMedia,
  EntryText,
  Photo,
  SectionGrid,
  sectionLabel,
  statsText,
  tx,
  type TemplateProps,
} from "../parts";
import { VoteResults } from "../vote-results";
import { EntrySocial } from "../social";

/** Ön sayfanın en üstündeki tanıtımlar: içerideki haberlere götürür. */
function Teasers({ sections, d }: { sections: NewsSection[]; d: ResolvedDesign }) {
  const say = tx(d);
  return (
    <nav aria-label={say("Bu sayıda", "In this issue")} className="np-rule mb-6 grid gap-x-6 gap-y-3 border-b pb-4 @2xl:grid-cols-3">
      {sections.map((s) => {
        const photo = firstPhoto(s);
        return (
          <a key={s.id} href={`#np-${s.id}`} className="group flex items-center gap-3">
            {photo?.src ? (
              <img src={photo.src} srcSet={photo.srcSet} sizes="64px" alt="" className="np-filter size-14 shrink-0 object-cover" />
            ) : null}
            <span className="min-w-0">
              <span className="np-accent block text-[0.62rem] font-bold uppercase tracking-[0.2em]">
                {sectionLabel(s, d) ?? say("Bu sayıda", "In this issue")}
              </span>
              <span className="np-head line-clamp-2 block text-[0.95rem] leading-tight group-hover:underline">{s.title}</span>
            </span>
          </a>
        );
      })}
    </nav>
  );
}

export function ClassicTemplate({ data, sections, d, cover }: TemplateProps) {
  const say = tx(d);
  // "Gazete sayfası gibi" düzende birinci sayfa gerçek bir gazete gibi kurulur.
  const front = d.pageLayout === "mosaic" ? frontPage(sections) : null;

  const entries = (s: NewsSection, { skipMediaId, rail = false }: { skipMediaId?: string; rail?: boolean } = {}) => (
    <div className="np-flow mt-6">
      {s.entries.map((e, ei) => {
        const entry = skipMediaId ? { ...e, media: e.media.filter((m) => m.id !== skipMediaId) } : e;
        return (
          <div key={e.id} className="mb-7">
            {/* Künye ve fotoğraf aynı sütunda kalsın; yoksa fotoğraf önceki yazara aitmiş gibi görünür.
                Künyeden sonra da sütun kırılmasın: yanıt künyenin hemen altından başlar. */}
            <div className="break-inside-avoid break-after-avoid">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]">
                <Byline author={e.author} d={d} suffix={say(" yazıyor", " writes")} />
              </p>
              <EntryMedia entry={entry} d={d} className="mt-3" />
            </div>
            <EntryText
              entry={entry}
              d={d}
              dropCap={!rail && ei === 0}
              hyphenate={d.pageLayout === "mosaic"}
              className="mt-2"
              headingClassName="italic"
            />
            <EntrySocial responseId={e.id} className="mt-3" />
          </div>
        );
      })}
    </div>
  );

  const section = (s: NewsSection, rail = false) => {
    const label = sectionLabel(s, d, front ? undefined : say("Manşet", "Headline"));
    const big = !front && s.index === 0;
    return (
      <section key={s.id} id={`np-${s.id}`} className="np-rule-ink np-section scroll-mt-4 border-t-2 pt-5">
        {label ? <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em]">{label}</p> : null}
        <h2 className={cn("mt-1 leading-[1.08]", rail ? "text-xl leading-tight" : big ? "text-4xl @2xl:text-6xl" : "text-3xl @2xl:text-4xl")}>
          {s.title}
        </h2>
        {s.vote ? <VoteResults vote={s.vote} d={d} className="mt-6" /> : s.entries.length ? entries(s, { rail }) : <EmptySection d={d} />}
      </section>
    );
  };

  const lead = front?.lead;
  // Manşet fotoğrafı: stüdyoda seçilen kapak, yoksa manşetin ilk fotoğrafı.
  const leadPhoto = !lead || d.cover === "none" ? null : d.cover !== "auto" && cover ? cover : firstPhoto(lead);
  const leadPhotoBy = leadPhoto && lead?.entries.find((e) => e.media.some((m) => m.id === leadPhoto.id))?.author;
  const quote = lead ? pullQuote(lead) : null;
  const left = front && front.rails.length === 2 ? front.rails[0] : null;
  const right = front ? (front.rails.length === 2 ? front.rails[1] : (front.rails[0] ?? null)) : null;
  const rest = front ? front.rest : sections;

  return (
    <div className="px-5 py-8 @2xl:px-10 @2xl:py-12">
      {front?.teasers.length ? <Teasers sections={front.teasers} d={d} /> : null}

      <header className={cn(d.align === "center" && "text-center")}>
        <div className="np-rule flex flex-wrap justify-between gap-2 border-b pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
          <span>{say("Sayı", "Issue")} {data.issueNumber}</span>
          {d.show.date ? <span>{formatDate(data.publishedAt, d.locale)}</span> : null}
          <span>{d.decorations === "none" ? say("Özel baskı", "Special edition") : say("Fiyatı: bir kahve ☕", "Price: one coffee ☕")}</span>
        </div>
        <h1 className="np-masthead mt-5 break-words text-5xl uppercase leading-[1.02] @2xl:text-7xl @5xl:text-8xl">{d.title}</h1>
        {d.tagline ? <p className="mt-2 text-lg italic">{d.tagline}</p> : null}
        <div className="np-rule-ink mt-4 border-y-[3px] border-double py-1.5 text-xs font-semibold uppercase tracking-[0.25em]">
          {data.issueTitle ?? say(`${data.contributors.length} muhabirden son haberler`, `The latest from ${data.contributors.length} correspondents`)}
        </div>
        <ContributorNames data={data} d={d} className="np-small mt-3 italic" />
      </header>

      {front && lead ? (
        <div className="np-front mt-8" data-rails={front.rails.length}>
          {left ? <div className="np-front-rail">{section(left, true)}</div> : null}
          <article id={`np-${lead.id}`} className={cn("np-front-lead scroll-mt-4", left && "np-front-sep")}>
            {leadPhoto ? (
              <Photo
                media={leadPhoto}
                d={d}
                alt={say("Manşet fotoğrafı", "Front-page photo")}
                sizes="(min-width: 1024px) 66vw, 100vw"
                caption={leadPhotoBy ? `${say("Fotoğraf", "Photo")}: ${leadPhotoBy.name}` : undefined}
              />
            ) : null}
            <p className={cn("text-[0.7rem] font-bold uppercase tracking-[0.28em]", leadPhoto && "mt-5")}>
              {[say("Manşet", "Headline"), sectionLabel(lead, d)].filter(Boolean).join(" · ")}
            </p>
            <h2 className="mt-1 text-4xl leading-[1.05] @2xl:text-5xl @5xl:text-6xl print:text-3xl">{lead.title}</h2>
            {quote ? (
              <p className="mt-3 text-xl italic leading-snug print:text-base">
                “{quote.text}” <span className="np-small np-muted not-italic">— {quote.author.name}</span>
              </p>
            ) : null}
            {entries(lead, { skipMediaId: leadPhoto?.id })}
          </article>
          {right ? <div className="np-front-rail np-front-sep">{section(right, true)}</div> : null}
        </div>
      ) : cover ? (
        <Photo media={cover} d={d} alt={say("Manşet fotoğrafı", "Front-page photo")} className="mt-8" sizes="100vw" caption={say("Manşet fotoğrafı", "Front-page photo")} />
      ) : null}

      <EditorNote d={d} title={say("Başyazı", "Editorial")} className="np-rule mt-8 border-y py-5" bodyClassName="@3xl:columns-2 @3xl:gap-8" />

      <SectionGrid sections={rest} d={d}>
        {rest.map((s) => section(s))}
      </SectionGrid>

      {d.decorations === "lots" ? (
        <p className="np-accent mt-12 text-center text-3xl tracking-[0.5em]" aria-hidden="true">
          ❦ ❦ ❦
        </p>
      ) : null}
      <ClosingNote d={d} className="np-rule mt-10 border-t pt-5 italic" />
      <footer className="np-rule-ink mt-12 border-t-[3px] border-double pt-3 text-center text-[0.7rem] uppercase tracking-[0.22em]">
        {say("Haber Var Matbaası", "Haber Var Press")}
        {d.show.stats ? ` · ${statsText(data, d)}` : ""} · {say("sevgiyle basılmıştır", "printed with love")}
      </footer>
    </div>
  );
}
