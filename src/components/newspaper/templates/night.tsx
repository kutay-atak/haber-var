import { cn } from "@/lib/utils";
import { NewsImage } from "../media";
import {
  Byline,
  ClosingNote,
  ContributorNames,
  EditorNote,
  EmptySection,
  EntryMedia,
  EntryText,
  issueMeta,
  sectionLabel,
  statsText,
  type TemplateProps,
} from "../parts";

export function NightTemplate({ data, sections, d, cover }: TemplateProps) {
  const center = d.align === "center";
  const glow = d.decorations !== "none" ? { textShadow: "0 0 32px color-mix(in srgb, var(--np-accent) 45%, transparent)" } : undefined;

  return (
    <div className="px-5 py-10 @2xl:px-12 @2xl:py-14">
      <header className={cn(center && "text-center")}>
        <div className={cn("flex flex-wrap items-center gap-3", center && "justify-center")}>
          <span className="np-on-accent rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.2em]">{d.tagline}</span>
          <span className="np-small np-muted font-semibold uppercase tracking-[0.2em]">{issueMeta(data, d)}</span>
        </div>
        <h1 className="mt-5 break-words text-5xl uppercase leading-[1.02] @2xl:text-7xl @5xl:text-8xl" style={glow}>
          {d.title}
        </h1>
        {data.issueTitle ? <p className="np-accent2 mt-3 text-2xl font-semibold">{data.issueTitle}</p> : null}
        <ContributorNames data={data} d={d} className="np-small np-muted mt-4" />
      </header>

      {cover ? (
        <figure className="relative mt-10 overflow-hidden" style={{ borderRadius: "var(--np-photo-radius)" }}>
          <NewsImage media={cover} alt="" sizes="100vw" className="np-filter max-h-[65vh] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--np-paper)] via-transparent to-transparent" />
        </figure>
      ) : null}

      <EditorNote d={d} className="np-tint np-rule np-section rounded-2xl border p-6 @2xl:p-8" />

      {sections.map((s) => {
        const label = sectionLabel(s, d);
        return (
          <section key={s.id} className="np-section">
            {label ? <p className="np-small np-accent2 font-bold uppercase tracking-[0.25em]">{label}</p> : null}
            <h2 className="mt-2 text-3xl leading-tight @2xl:text-5xl">{s.title}</h2>
            {d.decorations !== "none" ? (
              <div
                aria-hidden="true"
                className="mt-4 h-1 w-24 rounded-full"
                style={{ background: "linear-gradient(90deg, var(--np-accent), var(--np-accent2))" }}
              />
            ) : null}
            {s.entries.length ? (
              <div className="np-masonry mt-8">
                {s.entries.map((e) => (
                  <article key={e.id} className="np-tint np-rule rounded-2xl border p-6">
                    <Byline author={e.author} d={d} size="sm" className="font-bold" />
                    <EntryText entry={e} d={d} className="mt-3" headingClassName="np-accent" />
                    <EntryMedia entry={e} d={d} className="mt-4" />
                  </article>
                ))}
              </div>
            ) : (
              <EmptySection />
            )}
          </section>
        );
      })}

      <ClosingNote d={d} className="np-section np-muted" />
      <footer className="np-rule np-small np-muted mt-16 border-t pt-5 text-center">
        🌙 {d.title}
        {d.show.stats ? ` · ${statsText(data)}` : ""} · iyi geceler
      </footer>
    </div>
  );
}
