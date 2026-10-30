import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import {
  ClosingNote,
  ContributorChips,
  EditorNote,
  EmptySection,
  EntryText,
  issueMeta,
  Photo,
  statsText,
  Video,
  tx,
  askedByText,
  type TemplateProps,
} from "../parts";
import { VoteResults } from "../vote-results";
import { EntrySocial } from "../social";
import { NewsAudio } from "../media";

const TILTS = [-1.6, 1.2, -0.6, 1.8, -1.1, 0.7];
const NOTES = ["var(--np-note1)", "var(--np-note2)", "var(--np-note3)", "var(--np-note4)"];
const TAPES = [
  "color-mix(in srgb, var(--np-highlight) 78%, transparent)",
  "color-mix(in srgb, var(--np-accent2) 45%, transparent)",
  "color-mix(in srgb, var(--np-accent) 35%, transparent)",
];
const STICKERS = ["⭐", "🌼", "💛", "✨", "🎈", "🍀", "☀️", "🌙"];

export function ScrapbookTemplate({ data, sections, d, cover }: TemplateProps) {
  const say = tx(d);
  const playful = d.decorations !== "none";
  const tilt = (i: number) => (playful ? TILTS[i % TILTS.length] : 0);
  const tape = (i: number, extra?: CSSProperties) =>
    ({ "--tape-color": TAPES[i % TAPES.length], "--tape-tilt": `${tilt(i + 2) * 2}deg`, ...extra }) as CSSProperties;

  return (
    <div className="relative px-5 py-10 @2xl:px-14 @2xl:py-14">
      {playful ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-9 w-0.5 @2xl:left-12"
          style={{ background: "color-mix(in srgb, var(--np-accent) 35%, transparent)" }}
        />
      ) : null}
      <div className={cn(playful && "pl-7 @2xl:pl-8")}>
        <header className={cn(d.align === "center" && "text-center")}>
          <p className="np-head text-2xl">{issueMeta(data, d)}</p>
          <h1 className="mt-1 break-words text-6xl leading-none @2xl:text-7xl">
            <span className="np-marker">{d.title}</span>
          </h1>
          <p className="np-head mt-3 text-3xl">
            {data.issueTitle ?? d.tagline} {playful ? "✏️" : ""}
          </p>
          <ContributorChips
            data={data}
            d={d}
            className={cn("mt-6", d.align === "center" && "justify-center")}
            chipClassName="bg-white/80 text-[#3a3346] shadow-sm"
          />
        </header>

        {cover ? (
          <div className="mx-auto mt-12 max-w-md" style={{ transform: `rotate(${tilt(3)}deg)` }}>
            <Photo media={cover} d={d} alt="" className={cn(playful && "np-tape")} sizes="28rem" />
          </div>
        ) : null}

        {d.editorNote ? (
          <div
            className={cn("relative mx-auto mt-14 max-w-2xl rounded-sm p-6 pt-8 shadow-[0_10px_20px_-14px_rgb(0_0_0/0.45)]", playful && "np-tape")}
            style={tape(1, { background: "var(--np-note2)", transform: `rotate(${tilt(4)}deg)` })}
          >
            <EditorNote d={d} title={say("Editörün notu", "Editor's note")} titleClassName="np-head text-2xl normal-case tracking-normal" />
          </div>
        ) : null}

        {sections.map((s) => (
          <section key={s.id} className="np-section">
            <h2 className="text-4xl leading-tight @2xl:text-5xl">
              {playful ? (
                <span className="np-accent" aria-hidden="true">
                  ✦{" "}
                </span>
              ) : null}
              {s.title}
            </h2>
            {askedByText(s, d) ? <p className="np-head np-muted mt-2 text-2xl">✍️ {askedByText(s, d)}</p> : null}

            {s.vote ? (
            <VoteResults vote={s.vote} d={d} className="mt-6" />
          ) : s.entries.length ? (
              <div className="np-grid mt-10">
                {s.entries.map((e, ei) => {
                  const n = s.index * 7 + ei * 3;
                  const images = e.media.filter((m) => m.kind === "image");
                  const videos = e.media.filter((m) => m.kind === "video");
                  const audios = e.media.filter((m) => m.kind === "audio");
                  return (
                    <div key={e.id} className="print-avoid-break space-y-8">
                      {e.body || e.heading ? (
                        <div
                          className={cn("relative rounded-sm p-5 pt-7 shadow-[0_10px_20px_-14px_rgb(0_0_0/0.45)]", playful && "np-tape")}
                          style={tape(n, { background: NOTES[n % NOTES.length], transform: `rotate(${tilt(n)}deg)` })}
                        >
                          <EntryText entry={e} d={d} paragraphClassName="text-[1.18rem] leading-[1.5]" headingClassName="np-accent2 text-xl" />
                          <p className="np-head mt-3 text-right text-2xl">— {e.author.name}</p>
                          {d.decorations === "lots" ? (
                            <span className="absolute -right-3 -top-4 text-3xl" aria-hidden="true">
                              {STICKERS[n % STICKERS.length]}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {images.map((img, k) => (
                        <div key={img.id} className="mx-auto max-w-[19rem]" style={{ transform: `rotate(${tilt(n + 1 + k) * 1.6}deg)` }}>
                          <Photo
                            media={img}
                            d={d}
                            alt={`${say("Fotoğraf", "Photo")}: ${e.author.name}`}
                            square
                            sizes="19rem"
                            className={cn(playful && "np-tape")}
                            caption={<span className="np-head block text-center text-2xl leading-none">{e.author.name}</span>}
                          />
                        </div>
                      ))}
                      {videos.map((v, k) => (
                        <div key={v.id} className="mx-auto max-w-[22rem]" style={{ transform: `rotate(${tilt(n + 3 + k)}deg)` }}>
                          <Video
                            media={v}
                            d={d}
                            className={cn(playful && "np-tape")}
                            caption={<span className="np-head block text-center text-2xl leading-none">🎬 {e.author.name}</span>}
                          />
                        </div>
                      ))}
                      {audios.map((a, k) => (
                        <div key={a.id} className="mx-auto max-w-[22rem]" style={{ transform: `rotate(${tilt(n + 5 + k)}deg)` }}>
                          <NewsAudio media={a} locale={d.locale} className={cn(playful && "np-tape")} />
                        </div>
                      ))}
                      <EntrySocial responseId={e.id} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptySection d={d} className="np-head text-2xl not-italic">{say("Bu sayfa boş kaldı… bir dahaki sefere! 🍃", "This page stayed empty… maybe next time! 🍃")}</EmptySection>
            )}
          </section>
        ))}

        <footer className="np-section text-center">
          <ClosingNote d={d} className="mx-auto mb-6 max-w-xl text-xl" />
          <p className="np-head text-4xl">{say("Bir sonraki sayıda görüşmek üzere! 💌", "See you in the next issue! 💌")}</p>
          {d.show.stats ? <p className="np-muted mt-2 text-lg">{statsText(data, d)}</p> : null}
        </footer>
      </div>
    </div>
  );
}
