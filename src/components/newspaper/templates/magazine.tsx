import { formatDate } from "@/lib/format";
import { pullQuote } from "@/lib/newspaper";
import { cn } from "@/lib/utils";
import { NewsImage } from "../media";
import {
  Byline,
  ClosingNote,
  EditorNote,
  EmptySection,
  EntryMedia,
  EntryText,
  pad2,
  sectionLabel,
  statsText,
  tx,
  type TemplateProps,
} from "../parts";
import { VoteResults } from "../vote-results";
import { EntrySocial } from "../social";

export function MagazineTemplate({ data, sections, d, cover }: TemplateProps) {
  const say = tx(d);
  const center = d.align === "center";
  return (
    <div>
      <header
        className="relative flex min-h-[26rem] items-end overflow-hidden @3xl:min-h-[34rem]"
        style={{ background: "linear-gradient(135deg, var(--np-accent), var(--np-highlight))" }}
      >
        {cover ? <NewsImage media={cover} alt="" sizes="100vw" className="np-filter absolute inset-0 !h-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <span className="absolute right-5 top-5 rounded-full bg-white/95 px-4 py-1.5 text-sm font-extrabold text-[#16161d]">
          {say("Sayı", "Issue")} {data.issueNumber}
        </span>
        <div className={cn("relative w-full p-6 text-white @2xl:p-12", center && "text-center")}>
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-white/90">{d.title}</p>
          <h1 className="mt-2 break-words text-6xl leading-[0.92] @2xl:text-8xl">{data.issueTitle ?? `${say("Sayı", "Issue")} ${data.issueNumber}`}</h1>
          <p className="mt-4 text-lg font-semibold text-white/90">
            {[d.show.date ? formatDate(data.publishedAt, d.locale) : null, d.tagline].filter(Boolean).join(" · ")}
          </p>
        </div>
      </header>

      <nav className="np-rule grid gap-6 border-b px-6 py-10 @2xl:px-12 @3xl:grid-cols-[13rem_1fr]" aria-label={say("Bu sayıda", "In this issue")}>
        <h2 className="text-4xl">{say("Bu sayıda", "In this issue")}</h2>
        <ol className="grid gap-x-10 gap-y-4 @2xl:grid-cols-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#np-${s.id}`} className="group flex gap-3">
                {d.show.numbers ? (
                  <span className={cn("np-head text-3xl leading-none", s.index % 2 ? "np-accent2" : "np-accent")}>{pad2(s.index + 1)}</span>
                ) : null}
                <span className="font-semibold leading-snug group-hover:underline">{s.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <EditorNote d={d} className="np-rule border-b px-6 py-10 @2xl:px-12" bodyClassName="max-w-3xl text-lg" />

      {sections.map((s) => {
        const quoted = s.entries.map((e) => ({ e, quote: pullQuote(e.body) })).find((x) => x.quote);
        const accentClass = s.index % 2 ? "np-accent2" : "np-accent";
        const label = s.kind === "person" ? sectionLabel(s, d) : null;
        return (
          <section key={s.id} id={`np-${s.id}`} className="np-rule scroll-mt-20 border-b px-6 py-12 @2xl:px-12 @2xl:py-16">
            <div className="grid gap-8 @4xl:grid-cols-[1fr_1.2fr] @4xl:items-end">
              <div>
                {d.show.numbers && s.kind === "question" ? (
                  <p className={cn("np-head text-7xl leading-none @2xl:text-8xl", accentClass)}>{pad2(s.index + 1)}</p>
                ) : null}
                {label ? <p className={cn("text-sm font-extrabold uppercase tracking-[0.25em]", accentClass)}>{label}</p> : null}
                <h2 className="mt-3 text-4xl leading-[1.08] @2xl:text-5xl">{s.title}</h2>
              </div>
              {quoted && d.decorations !== "none" ? (
                <blockquote
                  className="border-l-4 pl-6"
                  style={{ borderColor: s.index % 2 ? "var(--np-accent2)" : "var(--np-accent)" }}
                >
                  <p className="np-head text-2xl italic leading-snug @2xl:text-3xl">“{quoted.quote}”</p>
                  <footer className="np-muted mt-3 font-bold">— {quoted.e.author.name}</footer>
                </blockquote>
              ) : null}
            </div>

            {s.vote ? (
            <VoteResults vote={s.vote} d={d} className="mt-6" />
          ) : s.entries.length ? (
              <div className="np-masonry mt-10">
                {s.entries.map((e) => (
                  <article key={e.id} className="np-tint rounded-[1.75rem] p-6">
                    <Byline author={e.author} d={d} size="md" className="font-extrabold" />
                    <EntryText entry={e} d={d} className="mt-3" headingClassName={accentClass} />
                    <EntryMedia entry={e} d={d} className="mt-4" />
                    <EntrySocial responseId={e.id} className="mt-4" />
                  </article>
                ))}
              </div>
            ) : (
              <EmptySection d={d} />
            )}
          </section>
        );
      })}

      <footer className="px-6 py-12 text-center @2xl:px-12">
        <ClosingNote d={d} className="mx-auto mb-8 max-w-2xl text-lg" />
        <p className="np-head text-3xl">{say("Bir sonraki sayıda görüşmek üzere.", "See you in the next issue.")}</p>
        <p className="np-muted mt-2">
          {d.title} · {say("Sayı", "Issue")} {data.issueNumber}
          {d.show.stats ? ` · ${statsText(data, d)}` : ""}
        </p>
      </footer>
    </div>
  );
}
