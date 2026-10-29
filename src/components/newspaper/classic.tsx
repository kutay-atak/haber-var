import { formatDate } from "@/lib/format";
import { paragraphs, type NewspaperData } from "@/lib/newspaper";
import { NewsImage, NewsVideo } from "./media";

export function ClassicNewspaper({ data }: { data: NewspaperData }) {
  const names = data.contributors.map((c) => c.name);

  return (
    <article className="np-classic mx-auto max-w-6xl px-5 py-8 shadow-lift sm:px-10 sm:py-12 print:px-0 print:shadow-none">
      <header className="text-center">
        <div className="flex flex-wrap justify-between gap-2 border-b border-[var(--np-rule)] pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em]">
          <span>Sayı {data.issueNumber}</span>
          <span>{formatDate(data.publishedAt)}</span>
          <span>Fiyatı: bir kahve ☕</span>
        </div>
        <h1 className="np-headline mt-5 break-words text-5xl font-black uppercase leading-[0.95] sm:text-7xl lg:text-8xl">
          {data.groupName}
        </h1>
        <p className="mt-2 text-lg italic">Uzaktaki dostların gündemi</p>
        <div className="mt-4 border-y-[3px] border-double border-[var(--np-ink)] py-1.5 text-xs font-semibold uppercase tracking-[0.25em]">
          {data.issueTitle ?? `${names.length} muhabirden son haberler`}
        </div>
        {names.length ? (
          <p className="mt-3 text-sm italic">
            Bu sayıda yazanlar: {names.join(", ")}
          </p>
        ) : null}
      </header>

      {data.questions.map((q, qi) => (
        <section key={q.id} className="mt-10 border-t-2 border-[var(--np-ink)] pt-5">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.28em]">{qi === 0 ? "Manşet" : `Soru ${qi + 1}`}</p>
          <h2
            className={`np-headline mt-1 font-bold leading-[1.08] ${qi === 0 ? "text-4xl sm:text-6xl" : "text-3xl sm:text-4xl"}`}
          >
            {q.text}
          </h2>

          {q.answers.length ? (
            <div className="np-columns mt-6">
              {q.answers.map((a, ai) => {
                const images = a.media.filter((m) => m.kind === "image");
                const videos = a.media.filter((m) => m.kind === "video");
                return (
                  <div key={a.id} className="mb-7">
                    {images[0] ? (
                      <figure className="np-photo print-avoid-break mb-3 break-inside-avoid">
                        <NewsImage media={images[0]} alt={`Fotoğraf: ${a.author.name}`} className="border border-[var(--np-rule)]" />
                        <figcaption className="mt-1 text-xs italic">Fotoğraf: {a.author.name}</figcaption>
                      </figure>
                    ) : null}
                    <p className="break-after-avoid text-[0.7rem] font-bold uppercase tracking-[0.22em]">
                      {a.author.name} yazıyor
                    </p>
                    {paragraphs(a.body).map((p, pi) => (
                      <p
                        key={pi}
                        className={`mt-2 whitespace-pre-line text-pretty text-[1.06rem] leading-[1.65] ${
                          ai === 0 && pi === 0 ? "np-dropcap" : ""
                        }`}
                      >
                        {p}
                      </p>
                    ))}
                    {images.length > 1 ? (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {images.slice(1).map((img) => (
                          <figure key={img.id} className="np-photo break-inside-avoid">
                            <NewsImage media={img} alt={`Fotoğraf: ${a.author.name}`} className="aspect-square object-cover" />
                          </figure>
                        ))}
                      </div>
                    ) : null}
                    {videos.map((v) => (
                      <figure key={v.id} className="print-avoid-break mt-3 break-inside-avoid border border-[var(--np-rule)] p-1.5">
                        <NewsVideo media={v} />
                        <figcaption className="mt-1 text-xs italic">▶ Görüntülü haber: {a.author.name}</figcaption>
                      </figure>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 italic">Bu soruya bu sayıda kimse yanıt vermedi. Belki bir dahakine!</p>
          )}
        </section>
      ))}

      <footer className="mt-12 border-t-[3px] border-double border-[var(--np-ink)] pt-3 text-center text-[0.7rem] uppercase tracking-[0.22em]">
        Haber Var Matbaası · {data.stats.answers} yazı · {data.stats.photos} fotoğraf · {data.stats.videos} video · sevgiyle
        basılmıştır
      </footer>
    </article>
  );
}
