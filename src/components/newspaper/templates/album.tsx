import type { NewsEntry } from "@/lib/design";
import { splitLead, type NewsMedia } from "@/lib/newspaper";
import { cn } from "@/lib/utils";
import { NewsAudio, NewsImage, NewsVideo } from "../media";
import {
  askedByText,
  Byline,
  cardCount,
  ClosingNote,
  ContributorChips,
  EditorNote,
  EmptySection,
  EntryText,
  issueMeta,
  pad2,
  Photo,
  SectionGrid,
  statsText,
  tx,
  type TemplateProps,
} from "../parts";
import { VoteResults } from "../vote-results";
import { EntrySocial } from "../social";

type Tile = { key: string; entry: NewsEntry; media: NewsMedia | null; first: boolean };

/** Önce fotoğraflar: her fotoğraf/video ayrı bir kare, yazı ilk karenin altında. */
function toTiles(entries: NewsEntry[]): Tile[] {
  return entries.flatMap<Tile>((entry) =>
    entry.media.length
      ? entry.media.map((media, i) => ({ key: media.id, entry, media, first: i === 0 }))
      : [{ key: entry.id, entry, media: null, first: true }],
  );
}

/** Fotoğrafı olmayan yanıt: ilk cümlesi büyük alıntı, devamı küçük. */
function TextTile({ entry, d }: { entry: NewsEntry; d: TemplateProps["d"] }) {
  const { lead, rest } = splitLead(entry.body);
  return (
    <blockquote className="np-tint print-avoid-break rounded-2xl p-6">
      {entry.heading ? <p className="np-muted mb-2 text-sm italic">{entry.heading}</p> : null}
      {lead ? <p className="np-head text-2xl leading-snug">“{lead}”</p> : null}
      {rest ? (
        <EntryText entry={{ ...entry, heading: null, body: rest }} d={d} className={cn("np-muted", lead && "mt-3")} paragraphClassName="text-[0.95em]" />
      ) : null}
      <footer className="mt-4">
        <Byline author={entry.author} d={d} className="np-small font-bold" />
      </footer>
      <EntrySocial responseId={entry.id} className="mt-3" />
    </blockquote>
  );
}

export function AlbumTemplate({ data, sections, d, cover }: TemplateProps) {
  const say = tx(d);
  const center = d.align === "center";
  return (
    <div className="px-5 py-10 @2xl:px-12 @2xl:py-14">
      <header className={cn(center && "text-center")}>
        <p className="np-small np-muted uppercase tracking-[0.3em]">{issueMeta(data, d)}</p>
        <h1 className="np-masthead mt-3 break-words text-5xl leading-none @2xl:text-7xl">{d.title}</h1>
        <p className="np-muted mt-3 text-xl italic">{data.issueTitle ?? d.tagline}</p>
        <ContributorChips data={data} d={d} className={cn("mt-6", center && "justify-center")} chipClassName="np-tint" />
      </header>

      {cover ? <Photo media={cover} d={d} alt="" className="mt-10" imgClassName="max-h-[70vh] w-full object-cover" sizes="100vw" /> : null}

      <EditorNote d={d} className={cn("np-section mx-auto max-w-2xl", center && "text-center")} bodyClassName="text-lg" />

      <SectionGrid sections={sections} d={d}>
        {sections.map((s) => (
          <section key={s.id} className="np-section">
            <div className={cn("flex items-baseline gap-4", center && "justify-center text-center")}>
              {d.show.numbers && s.kind === "question" ? <span className="np-head np-accent text-3xl">{pad2(s.index + 1)}</span> : null}
              <h2 className="text-3xl leading-tight @2xl:text-4xl">{s.title}</h2>
            </div>
            {askedByText(s, d) ? <p className="np-small np-muted mt-2 italic">{askedByText(s, d)}</p> : null}
            {d.decorations !== "none" ? (
              <div className={cn("np-rule mt-4 w-20 border-t-2", center && "mx-auto")} aria-hidden="true" />
            ) : null}

            {s.vote ? (
              <VoteResults vote={s.vote} d={d} className="mt-6" />
            ) : s.entries.length ? (
              <div className="np-masonry mt-8" style={cardCount(toTiles(s.entries).length)}>
                {toTiles(s.entries).map((t) =>
                  t.media ? (
                    <figure key={t.key} className="np-photo print-avoid-break">
                      {t.media.kind === "image" ? (
                        <NewsImage media={t.media} alt={`${say("Fotoğraf", "Photo")}: ${t.entry.author.name}`} sizes="(min-width: 1024px) 33vw, 50vw" />
                      ) : t.media.kind === "audio" ? (
                        <NewsAudio media={t.media} locale={d.locale} />
                      ) : (
                        <div className="overflow-hidden" style={{ borderRadius: "var(--np-photo-radius)" }}>
                          <NewsVideo media={t.media} locale={d.locale} />
                        </div>
                      )}
                      {t.first ? (
                        <figcaption className="mt-3">
                          <Byline author={t.entry.author} d={d} className="np-small font-bold" />
                          <EntryText entry={t.entry} d={d} className="np-muted mt-1.5" paragraphClassName="text-[0.95em]" headingClassName="text-base italic" />
                          <EntrySocial responseId={t.entry.id} className="mt-3" />
                        </figcaption>
                      ) : null}
                    </figure>
                  ) : (
                    <TextTile key={t.key} entry={t.entry} d={d} />
                  ),
                )}
              </div>
            ) : (
              <EmptySection d={d} />
            )}
          </section>
        ))}
      </SectionGrid>

      <footer className={cn("np-section", center && "text-center")}>
        <ClosingNote d={d} className="mx-auto mb-6 max-w-xl text-lg" />
        {d.show.stats ? <p className="np-muted mt-2">{statsText(data, d)}</p> : null}
      </footer>
    </div>
  );
}
