import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Byline,
  ClosingNote,
  EditorNote,
  EmptySection,
  EntryMedia,
  EntryText,
  Photo,
  sectionLabel,
  statsText,
  type TemplateProps,
} from "../parts";

const SHOUTS = ["ŞOK!", "FLAŞ!", "İDDİA", "ÖZEL", "BOMBA!", "SKANDAL"];

export function TabloidTemplate({ data, sections, d, cover }: TemplateProps) {
  const loud = d.decorations !== "none";
  return (
    <div>
      <header className={cn("np-on-accent px-5 pb-6 pt-5 @2xl:px-10", d.align === "center" && "text-center")}>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem] font-extrabold uppercase tracking-[0.2em] opacity-90">
          <span>Sayı {data.issueNumber}</span>
          {d.show.date ? <span>{formatDate(data.publishedAt)}</span> : null}
          <span>{loud ? "Fiyatı: 1 simit 🥯" : "Özel baskı"}</span>
        </div>
        <h1 className="mt-3 break-words text-6xl uppercase leading-[1.02] @2xl:text-8xl @5xl:text-9xl">{d.title}</h1>
      </header>
      <div className="np-on-highlight flex flex-wrap items-center justify-center gap-3 px-4 py-2 text-center text-sm font-extrabold uppercase tracking-[0.15em]">
        {loud ? <span className="np-on-accent -rotate-1 rounded px-2 py-0.5">Son dakika</span> : null}
        <span>{d.tagline}</span>
      </div>

      <div className="px-5 py-8 @2xl:px-10">
        {cover || data.issueTitle ? (
          <section className="relative">
            {cover ? (
              <Photo
                media={cover}
                d={d}
                alt=""
                sizes="100vw"
                imgClassName="max-h-[60vh] w-full border-4 border-[var(--np-ink)] object-cover"
              />
            ) : null}
            <div className={cn("np-on-highlight relative p-4 @2xl:p-6", cover && "-mt-14 mx-3 @2xl:mx-10")}>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em]">Manşet</p>
              <p className="np-head text-4xl uppercase leading-[1.05] @2xl:text-6xl">
                {data.issueTitle ?? "Bu sayının bütün haberleri"}
              </p>
            </div>
          </section>
        ) : null}

        <EditorNote
          d={d}
          title="Genel yayın yönetmeninden"
          className="np-rule-ink mt-8 border-y-4 py-5"
          bodyClassName="font-semibold"
        />

        {sections.map((s, si) => {
          const label = sectionLabel(s, d);
          return (
            <section key={s.id} className="np-rule-ink np-section border-t-4 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                {loud ? (
                  <span className="np-on-accent -rotate-2 px-2 py-0.5 text-sm font-extrabold uppercase">{SHOUTS[si % SHOUTS.length]}</span>
                ) : null}
                {label ? <span className="np-small font-extrabold uppercase tracking-[0.2em]">{label}</span> : null}
              </div>
              <h2 className="mt-2 text-4xl uppercase leading-[1.05] @2xl:text-6xl">{s.title}</h2>
              {s.entries.length ? (
                <div className="np-grid mt-6">
                  {s.entries.map((e, ei) => (
                    <article key={e.id} className="np-rule border-b pb-5">
                      {loud && si === 0 && ei === 0 ? (
                        <span className="np-rule-accent np-accent mb-2 inline-block -rotate-3 border-4 px-2 py-0.5 text-xs font-black uppercase tracking-widest">
                          Özel haber
                        </span>
                      ) : null}
                      <p className="np-small font-extrabold uppercase tracking-wide">
                        <Byline author={e.author} d={d} prefix="Muhabirimiz " suffix=" bildiriyor" />
                      </p>
                      <EntryMedia entry={e} d={d} className="mt-3 [&_img]:border-4 [&_img]:border-[var(--np-ink)]" />
                      <EntryText entry={e} d={d} className="mt-3" headingClassName="text-xl uppercase" paragraphClassName="font-medium" />
                    </article>
                  ))}
                </div>
              ) : (
                <EmptySection>Muhabirlerimiz bu konuda henüz konuşmadı.</EmptySection>
              )}
            </section>
          );
        })}

        <ClosingNote d={d} className="np-section font-semibold" />
      </div>
      <footer className="np-on-ink px-5 py-4 text-center text-xs font-bold uppercase tracking-[0.2em]">
        Haber Var Medya Grubu{d.show.stats ? ` · ${statsText(data)}` : ""} · Tüm hakları sevgiyle saklıdır
      </footer>
    </div>
  );
}
