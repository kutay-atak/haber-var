import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  askedByText,
  ClosingNote,
  ContributorNames,
  EditorNote,
  EmptySection,
  EntryMedia,
  EntryText,
  Photo,
  SectionGrid,
  statsText,
  tx,
  type TemplateProps,
} from "../parts";
import { VoteResults } from "../vote-results";
import { EntrySocial } from "../social";

/** Uçak postası zarfının kenar şeridi. */
const AIRMAIL =
  "repeating-linear-gradient(135deg, var(--np-accent) 0 14px, transparent 14px 28px, var(--np-accent2) 28px 42px, transparent 42px 56px)";

export function LetterTemplate({ data, sections, d, cover }: TemplateProps) {
  const say = tx(d);
  const fancy = d.decorations !== "none";
  // Mektup kâğıdı zarftan biraz daha açık olsun; koyu paletlerde kart rengini kullan.
  const sheet = d.isDark ? "var(--np-tint)" : "color-mix(in srgb, var(--np-paper) 45%, #ffffff)";

  return (
    <div>
      {d.decorations === "lots" ? <div aria-hidden="true" className="h-2.5" style={{ background: AIRMAIL }} /> : null}
      <div className="px-5 py-10 @2xl:px-12 @2xl:py-14">
        <header>
          <div className={cn("flex flex-wrap items-start justify-between gap-6", d.align === "center" && "flex-col items-center text-center")}>
            <div className="min-w-0">
              <p className="np-small np-muted uppercase tracking-[0.25em]">{say("Kimden", "From")}</p>
              <h1 className="np-masthead mt-1 break-words text-5xl leading-tight @2xl:text-6xl">{d.title}</h1>
              <p className="np-muted mt-2 text-lg italic">{data.issueTitle ?? d.tagline}</p>
            </div>
            {fancy ? (
              <div className="relative shrink-0" aria-hidden="true">
                <div className="np-shape-pul rotate-3">
                  <div className="np-on-accent flex size-24 flex-col items-center justify-center">
                    <span className="np-head text-4xl leading-none">{data.issueNumber}</span>
                    <span className="mt-1 text-[0.6rem] font-bold uppercase tracking-widest">{say("Sayı", "Issue")}</span>
                  </div>
                </div>
                {d.show.date ? (
                  <div className="np-rule-ink absolute -bottom-6 -left-12 flex size-24 -rotate-12 items-center justify-center rounded-full border-2 border-double text-center text-[0.6rem] font-bold uppercase leading-tight tracking-wider opacity-70">
                    Haber Var
                    <br />
                    {formatDate(data.publishedAt, d.locale)}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          {!fancy || !d.show.date ? (
            <p className="np-small np-muted mt-4">
              {say("Sayı", "Issue")} {data.issueNumber}
              {d.show.date ? ` · ${formatDate(data.publishedAt, d.locale)}` : ""}
            </p>
          ) : null}
          <div className="np-rule mt-8 border-b-2 border-dashed" />
          <ContributorNames data={data} d={d} prefix={say("Bu zarfta mektubu olanlar: ", "Letters in this envelope from: ")} className="np-small np-muted mt-4 italic" />
        </header>

        {cover ? (
          <div className="mx-auto mt-10 max-w-lg -rotate-1">
            <Photo media={cover} d={d} alt="" sizes="32rem" caption={say("Zarfın içinden çıkan fotoğraf", "Found inside the envelope")} />
          </div>
        ) : null}

        {d.editorNote ? (
          <section className="np-section">
            <p className="np-head text-3xl">{say("Sevgili dostlar,", "Dear friends,")}</p>
            <EditorNote d={d} title="" className="mt-2" />
          </section>
        ) : null}

        <SectionGrid sections={sections} d={d}>
          {sections.map((s) => (
            <section key={s.id} className="np-section">
              <p className="np-small np-accent font-bold uppercase tracking-[0.25em]">
                {s.kind === "person" ? say("Kimden", "From") : d.show.numbers ? `${say("Konu", "Topic")} ${s.index + 1}` : say("Konu", "Topic")}
                {askedByText(s, d) ? ` · ${askedByText(s, d)}` : ""}
              </p>
              <h2 className="mt-1 text-3xl leading-snug @2xl:text-4xl">{s.title}</h2>
              {s.vote ? (
              <VoteResults vote={s.vote} d={d} className="mt-6" />
            ) : s.entries.length ? (
                <div className="np-grid mt-6">
                  {s.entries.map((e) => (
                    <article
                      key={e.id}
                      className="print-avoid-break relative rounded-md p-6 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_14px_30px_-20px_rgb(0_0_0/0.4)] @2xl:p-8"
                      style={{
                        background: sheet,
                        backgroundImage:
                          "repeating-linear-gradient(transparent 0 31px, color-mix(in srgb, var(--np-accent2) 14%, transparent) 31px 32px)",
                      }}
                    >
                      {d.decorations === "lots" ? (
                        <span
                          aria-hidden="true"
                          className="np-rule-ink absolute -top-3 right-8 h-10 w-4 rounded-full border-[3px] opacity-60"
                        />
                      ) : null}
                      <EntryText entry={e} d={d} headingClassName="np-muted text-base italic" />
                      <EntryMedia entry={e} d={d} className="mt-5" />
                      <div className="mt-5 flex items-center justify-end gap-3">
                        {d.show.avatars ? <Avatar name={e.author.name} src={e.author.avatarUrl} size="sm" /> : null}
                        <p className="np-head np-accent text-3xl leading-none">{e.author.name}</p>
                      </div>
                      <EntrySocial responseId={e.id} className="mt-4" />
                    </article>
                  ))}
                </div>
              ) : (
                <EmptySection d={d}>{say("Bu konuya bu sayıda kimse mektup yazmadı.", "Nobody wrote a letter on this topic in this issue.")}</EmptySection>
              )}
            </section>
          ))}
        </SectionGrid>

        <footer className="np-section">
          <ClosingNote d={d} className="text-lg" />
          <p className="np-head mt-6 text-3xl">{say("Sevgiyle,", "With love,")}</p>
          <p className="np-head np-accent text-4xl">{d.title}</p>
          {d.show.stats ? <p className="np-muted mt-8 italic">Not: Bu zarfta {statsText(data, d)} var.</p> : null}
        </footer>
      </div>
      {d.decorations === "lots" ? <div aria-hidden="true" className="h-2.5" style={{ background: AIRMAIL }} /> : null}
    </div>
  );
}
