import { cn } from "@/lib/utils";
import {
  Byline,
  ClosingNote,
  ContributorNames,
  EditorNote,
  EmptySection,
  EntryMedia,
  EntryText,
  issueMeta,
  Photo,
  statsText,
  tx,
  type TemplateProps,
} from "../parts";

function Wave() {
  return (
    <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="mb-10 h-6 w-full" aria-hidden="true">
      <path
        d="M0 20 Q 75 0 150 20 T 300 20 T 450 20 T 600 20 T 750 20 T 900 20 T 1050 20 T 1200 20"
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        style={{ stroke: "var(--np-accent)" }}
      />
    </svg>
  );
}

export function RetroTemplate({ data, sections, d, cover }: TemplateProps) {
  const say = tx(d);
  const funky = d.decorations !== "none";
  const center = d.align === "center";
  return (
    <div className="px-5 py-10 @2xl:px-12 @2xl:py-14">
      <header className={cn("np-tint relative overflow-hidden rounded-[2rem] px-6 py-12 @2xl:py-16", center && "text-center")}>
        {funky ? (
          <div aria-hidden="true" className="np-sunburst absolute left-1/2 top-1/2 size-[160%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        ) : null}
        <div className="relative">
          <p className="np-on-accent2 inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-[0.2em]">
            {issueMeta(data, d)}
          </p>
          <h1
            className="np-accent mt-4 break-words text-6xl leading-[0.95] @2xl:text-8xl"
            style={funky ? { textShadow: "4px 4px 0 var(--np-highlight)" } : undefined}
          >
            {d.title}
          </h1>
          <p className="mt-4 text-xl font-semibold">{data.issueTitle ?? d.tagline}</p>
          <ContributorNames data={data} d={d} className="np-small np-muted mt-3" />
        </div>
      </header>

      {cover ? (
        <Photo
          media={cover}
          d={d}
          alt=""
          className="mx-auto mt-10 max-w-3xl"
          imgClassName="border-4 border-[var(--np-ink)] shadow-[8px_8px_0_var(--np-accent)]"
          sizes="48rem"
        />
      ) : null}

      {d.editorNote ? (
        <div className="np-rule-ink np-paper np-section mx-auto max-w-2xl rounded-[1.5rem] border-[3px] p-6" style={{ boxShadow: "6px 6px 0 var(--np-accent2)" }}>
          <EditorNote d={d} title={say("Yayın kurulundan", "From the editorial board")} />
        </div>
      ) : null}

      {sections.map((s, si) => (
        <section key={s.id} className="np-section">
          {funky && si > 0 ? <Wave /> : null}
          <div className={cn("flex items-center gap-4", center && "flex-col text-center")}>
            {d.show.numbers && s.kind === "question" ? (
              <span className="np-on-accent np-head flex size-14 shrink-0 items-center justify-center rounded-full text-2xl">{s.index + 1}</span>
            ) : null}
            <h2 className="text-3xl leading-tight @2xl:text-5xl">{s.title}</h2>
          </div>
          {s.entries.length ? (
            <div className="np-masonry mt-8">
              {s.entries.map((e) => (
                <article
                  key={e.id}
                  className="np-rule-ink np-paper rounded-[1.5rem] border-[3px] p-6"
                  style={{ boxShadow: "6px 6px 0 var(--np-ink)" }}
                >
                  <Byline author={e.author} d={d} size="sm" className="np-accent2 font-bold" />
                  <EntryText entry={e} d={d} className="mt-3" headingClassName="np-accent text-xl" />
                  <EntryMedia entry={e} d={d} className="mt-4" />
                </article>
              ))}
            </div>
          ) : (
            <EmptySection d={d} />
          )}
        </section>
      ))}

      <footer className="np-section text-center">
        <ClosingNote d={d} className="mx-auto mb-6 max-w-xl text-lg" />
        <p className="np-head np-accent text-4xl">{say("Görüşmek üzere, dostum! ✌️", "Catch you later, friend! ✌️")}</p>
        {d.show.stats ? <p className="np-muted mt-2">{statsText(data, d)}</p> : null}
      </footer>
    </div>
  );
}
