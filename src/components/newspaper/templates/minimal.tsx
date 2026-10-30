import { cn } from "@/lib/utils";
import {
  askedByText,
  Byline,
  cardCount,
  ClosingNote,
  ContributorNames,
  EditorNote,
  EmptySection,
  EntryMedia,
  EntryText,
  issueMeta,
  pad2,
  Photo,
  SectionGrid,
  statsText,
  type TemplateProps,
} from "../parts";
import { VoteResults } from "../vote-results";
import { EntrySocial } from "../social";

export function MinimalTemplate({ data, sections, d, cover }: TemplateProps) {
  const center = d.align === "center";
  return (
    <div className="px-6 py-12 @2xl:px-16 @2xl:py-20">
      <header className={cn(center && "text-center")}>
        <p className="np-small np-muted font-semibold uppercase tracking-[0.25em]">{issueMeta(data, d)}</p>
        <h1 className="np-masthead mt-6 break-words text-5xl leading-[0.95] tracking-tight @2xl:text-7xl">{d.title}</h1>
        <p className="np-muted mt-4 text-xl">{data.issueTitle ?? d.tagline}</p>
        <ContributorNames data={data} d={d} prefix="" className="np-small np-muted mt-6" />
        <div className="np-rule-ink mt-10 border-t" />
      </header>

      {cover ? <Photo media={cover} d={d} alt="" className="mt-12" sizes="100vw" /> : null}

      <EditorNote d={d} className="np-section" bodyClassName="text-xl leading-relaxed" />

      <SectionGrid sections={sections} d={d}>
        {sections.map((s) => (
          <section key={s.id} className="np-section">
            <div className={cn("flex items-baseline gap-5", center && "justify-center text-center")}>
              {d.show.numbers && s.kind === "question" ? (
                <span className="np-small np-accent font-bold tabular-nums">{pad2(s.index + 1)}</span>
              ) : null}
              <h2 className="text-3xl leading-tight tracking-tight @2xl:text-4xl">{s.title}</h2>
            </div>
            {askedByText(s, d) ? <p className="np-small np-muted mt-2 italic">{askedByText(s, d)}</p> : null}
            {s.vote ? (
              <VoteResults vote={s.vote} d={d} className="mt-6" />
            ) : s.entries.length ? (
              <div className="np-grid mt-8" style={cardCount(s.entries.length)}>
                {s.entries.map((e) => (
                  <article key={e.id} className="np-rule border-t pt-6">
                    <Byline author={e.author} d={d} className="np-small np-accent font-bold uppercase tracking-[0.18em]" />
                    <EntryText entry={e} d={d} className="mt-3" headingClassName="np-muted text-base" />
                    <EntryMedia entry={e} d={d} className="mt-5" />
                    <EntrySocial responseId={e.id} className="mt-4" />
                  </article>
                ))}
              </div>
            ) : (
              <EmptySection d={d} />
            )}
          </section>
        ))}
      </SectionGrid>

      <ClosingNote d={d} className="np-section np-muted" />
      <footer className="np-rule-ink np-small np-muted mt-16 flex flex-wrap justify-between gap-2 border-t pt-4">
        <span>{d.title}</span>
        {d.show.stats ? <span>{statsText(data, d)}</span> : null}
      </footer>
    </div>
  );
}
