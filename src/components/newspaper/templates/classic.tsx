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
  sectionLabel,
  statsText,
  type TemplateProps,
} from "../parts";

export function ClassicTemplate({ data, sections, d, cover }: TemplateProps) {
  return (
    <div className="px-5 py-8 @2xl:px-10 @2xl:py-12">
      <header className={cn(d.align === "center" && "text-center")}>
        <div className="np-rule flex flex-wrap justify-between gap-2 border-b pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
          <span>Sayı {data.issueNumber}</span>
          {d.show.date ? <span>{formatDate(data.publishedAt)}</span> : null}
          <span>{d.decorations === "none" ? "Özel baskı" : "Fiyatı: bir kahve ☕"}</span>
        </div>
        <h1 className="mt-5 break-words text-5xl uppercase leading-[1.02] @2xl:text-7xl @5xl:text-8xl">{d.title}</h1>
        {d.tagline ? <p className="mt-2 text-lg italic">{d.tagline}</p> : null}
        <div className="np-rule-ink mt-4 border-y-[3px] border-double py-1.5 text-xs font-semibold uppercase tracking-[0.25em]">
          {data.issueTitle ?? `${data.contributors.length} muhabirden son haberler`}
        </div>
        <ContributorNames data={data} d={d} className="np-small mt-3 italic" />
      </header>

      {cover ? <Photo media={cover} d={d} alt="Manşet fotoğrafı" className="mt-8" sizes="100vw" caption="Manşet fotoğrafı" /> : null}

      <EditorNote d={d} title="Başyazı" className="np-rule mt-8 border-y py-5" bodyClassName="@3xl:columns-2 @3xl:gap-8" />

      {sections.map((s) => {
        const label = sectionLabel(s, d, "Manşet");
        return (
          <section key={s.id} className="np-rule-ink np-section border-t-2 pt-5">
            {label ? <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em]">{label}</p> : null}
            <h2 className={cn("mt-1 leading-[1.08]", s.index === 0 ? "text-4xl @2xl:text-6xl" : "text-3xl @2xl:text-4xl")}>
              {s.title}
            </h2>
            {s.entries.length ? (
              <div className="np-flow mt-6">
                {s.entries.map((e, ei) => (
                  <div key={e.id} className="mb-7">
                    {/* Künye ve fotoğraf aynı sütunda kalsın; yoksa fotoğraf önceki yazara aitmiş gibi görünür. */}
                    <div className="break-inside-avoid">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em]">
                        <Byline author={e.author} d={d} suffix=" yazıyor" />
                      </p>
                      <EntryMedia entry={e} d={d} className="mt-3" />
                    </div>
                    <EntryText entry={e} d={d} dropCap={ei === 0} className="mt-2" headingClassName="italic" />
                  </div>
                ))}
              </div>
            ) : (
              <EmptySection />
            )}
          </section>
        );
      })}

      {d.decorations === "lots" ? (
        <p className="np-accent mt-12 text-center text-3xl tracking-[0.5em]" aria-hidden="true">
          ❦ ❦ ❦
        </p>
      ) : null}
      <ClosingNote d={d} className="np-rule mt-10 border-t pt-5 italic" />
      <footer className="np-rule-ink mt-12 border-t-[3px] border-double pt-3 text-center text-[0.7rem] uppercase tracking-[0.22em]">
        Haber Var Matbaası{d.show.stats ? ` · ${statsText(data)}` : ""} · sevgiyle basılmıştır
      </footer>
    </div>
  );
}
