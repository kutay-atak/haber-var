import type { CSSProperties } from "react";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";
import type { NewspaperData } from "@/lib/newspaper";
import { NewsImage, NewsVideo } from "./media";

const TILTS = [-1.6, 1.2, -0.6, 1.8, -1.1, 0.7];
const NOTES = ["bg-[#fff4b0]", "bg-[#ffdcd2]", "bg-[#d9f1e2]", "bg-[#dce9f7]", "bg-[#f1e2f5]"];
const TAPES = ["rgb(242 204 143 / 0.8)", "rgb(129 178 154 / 0.55)", "rgb(168 197 218 / 0.7)", "rgb(224 122 95 / 0.45)"];

function tilt(i: number) {
  return TILTS[i % TILTS.length];
}

function tape(i: number, extra?: CSSProperties): CSSProperties {
  return { "--tape-color": TAPES[i % TAPES.length], "--tape-tilt": `${tilt(i + 2) * 2}deg`, ...extra } as CSSProperties;
}

export function ScrapbookNewspaper({ data }: { data: NewspaperData }) {
  return (
    <article className="np-scrapbook mx-auto max-w-5xl overflow-hidden rounded-[1.5rem] py-10 pl-16 pr-5 shadow-lift sm:py-14 sm:pl-24 sm:pr-14 print:shadow-none">
      <header className="text-center">
        <p className="font-hand text-2xl">
          Sayı {data.issueNumber} · {formatDate(data.publishedAt)}
        </p>
        <h1 className="np-headline mt-1 break-words text-6xl leading-none sm:text-7xl">
          <span className="marker">{data.groupName}</span>
        </h1>
        <p className="mt-3 font-hand text-3xl">{data.issueTitle ?? "defterinden notlar"} ✏️</p>
        {data.contributors.length ? (
          <ul className="mt-6 flex flex-wrap justify-center gap-3">
            {data.contributors.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-full bg-white/85 py-1 pl-1 pr-4 shadow-sm"
                style={{ transform: `rotate(${tilt(i)}deg)` }}
              >
                <Avatar name={c.name} src={c.avatarUrl} size="xs" />
                <span className="text-lg">{c.name}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {data.questions.map((q, qi) => (
        <section key={q.id} className="mt-16">
          <h2 className="np-headline text-4xl leading-tight sm:text-5xl">
            <span className="text-terracotta" aria-hidden="true">
              ✦{" "}
            </span>
            {q.text}
          </h2>

          {q.answers.length ? (
            <div className="mt-10 grid gap-x-10 gap-y-12 sm:grid-cols-2">
              {q.answers.map((a, ai) => {
                const images = a.media.filter((m) => m.kind === "image");
                const videos = a.media.filter((m) => m.kind === "video");
                // Her not ve polaroid farklı açı ve renk alsın diye sıra numarası.
                const n = qi * 7 + ai * 3;
                return (
                  <div key={a.id} className="print-avoid-break space-y-8">
                    {a.body ? (
                      <div
                        className={`np-tape rounded-sm p-5 pt-7 shadow-[0_10px_20px_-14px_rgb(0_0_0/0.45)] ${NOTES[n % NOTES.length]}`}
                        style={tape(n, { transform: `rotate(${tilt(n)}deg)` })}
                      >
                        <p className="whitespace-pre-line text-[1.22rem] leading-[1.5]">{a.body}</p>
                        <p className="mt-3 text-right font-hand text-2xl">— {a.author.name}</p>
                      </div>
                    ) : null}
                    {images.map((img, k) => (
                      <figure
                        key={img.id}
                        className="np-polaroid np-tape mx-auto max-w-[19rem]"
                        style={tape(n + 1 + k, { transform: `rotate(${tilt(n + 1 + k) * 1.6}deg)` })}
                      >
                        <NewsImage media={img} alt={`Fotoğraf: ${a.author.name}`} className="aspect-square object-cover" sizes="320px" />
                        <figcaption className="mt-2 text-center font-hand text-2xl leading-none">{a.author.name}</figcaption>
                      </figure>
                    ))}
                    {videos.map((v, k) => (
                      <figure
                        key={v.id}
                        className="np-polaroid np-tape mx-auto max-w-[22rem]"
                        style={tape(n + 3 + k, { transform: `rotate(${tilt(n + 3 + k)}deg)` })}
                      >
                        <NewsVideo media={v} />
                        <figcaption className="mt-2 text-center font-hand text-2xl leading-none">🎬 {a.author.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 font-hand text-2xl text-[#6b6478]">Bu sayfa boş kaldı… bir dahaki sefere! 🍃</p>
          )}
        </section>
      ))}

      <footer className="mt-20 text-center">
        <p className="font-hand text-4xl">Bir sonraki sayıda görüşmek üzere! 💌</p>
        <p className="mt-2 text-lg text-[#6b6478]">
          {data.stats.answers} not · {data.stats.photos} fotoğraf · {data.stats.videos} video
        </p>
      </footer>
    </article>
  );
}
