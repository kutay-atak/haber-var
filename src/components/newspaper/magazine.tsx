import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";
import { firstImage, paragraphs, pullQuote, type NewspaperData } from "@/lib/newspaper";
import { NewsImage, NewsVideo } from "./media";

const ACCENTS = [
  { text: "text-terracotta-deep", border: "border-terracotta", bg: "bg-terracotta-soft/50" },
  { text: "text-sage-deep", border: "border-sage", bg: "bg-sage-soft/60" },
  { text: "text-sky-ink", border: "border-sky", bg: "bg-sky-soft/70" },
  { text: "text-mustard-ink", border: "border-mustard", bg: "bg-mustard-soft/70" },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function MagazineNewspaper({ data }: { data: NewspaperData }) {
  const cover = firstImage(data);

  return (
    <article className="np-magazine mx-auto max-w-6xl overflow-hidden rounded-[2rem] shadow-lift print:rounded-none print:shadow-none">
      <header className="relative flex min-h-[26rem] items-end overflow-hidden bg-gradient-to-br from-terracotta via-[#e9a178] to-mustard text-white sm:min-h-[36rem]">
        {cover ? (
          <NewsImage media={cover} alt="" sizes="100vw" className="absolute inset-0 !h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        <span className="absolute right-5 top-5 rounded-full bg-white/95 px-4 py-1.5 text-sm font-extrabold text-ink">
          Sayı {data.issueNumber}
        </span>
        <div className="relative w-full p-6 sm:p-12">
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-white/90">{data.groupName}</p>
          <h1 className="np-headline mt-2 break-words text-6xl leading-[0.92] sm:text-8xl">
            {data.issueTitle ?? `Sayı ${data.issueNumber}`}
          </h1>
          <p className="mt-4 text-lg font-semibold text-white/90">
            {formatDate(data.publishedAt)} · {data.contributors.length} kalem · {data.stats.photos} fotoğraf
          </p>
        </div>
      </header>

      <nav className="grid gap-6 border-b border-line px-6 py-10 sm:grid-cols-[13rem_1fr] sm:px-12" aria-label="Bu sayıda">
        <h2 className="np-headline text-4xl">Bu sayıda</h2>
        <ol className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {data.questions.map((q, i) => (
            <li key={q.id}>
              <a href={`#soru-${q.id}`} className="group flex gap-3">
                <span className={`np-headline text-3xl leading-none ${ACCENTS[i % ACCENTS.length].text}`}>{pad(i + 1)}</span>
                <span className="font-semibold leading-snug group-hover:underline">{q.text}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {data.questions.map((q, i) => {
        const accent = ACCENTS[i % ACCENTS.length];
        const quoted = q.answers.map((a) => ({ a, quote: pullQuote(a.body) })).find((x) => x.quote);
        return (
          <section key={q.id} id={`soru-${q.id}`} className="scroll-mt-20 border-b border-line px-6 py-12 sm:px-12 sm:py-16">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-end">
              <div>
                <p className={`np-headline text-7xl leading-none sm:text-8xl ${accent.text}`}>{pad(i + 1)}</p>
                <h2 className="np-headline mt-3 text-4xl leading-[1.08] sm:text-5xl">{q.text}</h2>
              </div>
              {quoted ? (
                <blockquote className={`border-l-4 ${accent.border} pl-6`}>
                  <p className="np-headline text-2xl italic leading-snug sm:text-3xl">“{quoted.quote}”</p>
                  <footer className="mt-3 font-bold text-ink-soft">— {quoted.a.author.name}</footer>
                </blockquote>
              ) : null}
            </div>

            {q.answers.length ? (
              <div className="mt-10 gap-6 md:columns-2">
                {q.answers.map((a) => (
                  <div key={a.id} className={`mb-6 break-inside-avoid rounded-[1.75rem] p-6 ${accent.bg}`}>
                    <div className="flex items-center gap-3">
                      <Avatar name={a.author.name} src={a.author.avatarUrl} size="md" />
                      <p className="font-extrabold">{a.author.name}</p>
                    </div>
                    {paragraphs(a.body).map((p, pi) => (
                      <p key={pi} className="mt-3 whitespace-pre-line text-[1.05rem] leading-relaxed">
                        {p}
                      </p>
                    ))}
                    {a.media.length ? (
                      <div className={`mt-4 grid gap-3 ${a.media.length > 1 ? "grid-cols-2" : ""}`}>
                        {a.media.map((m) =>
                          m.kind === "image" ? (
                            <NewsImage
                              key={m.id}
                              media={m}
                              alt={`Fotoğraf: ${a.author.name}`}
                              className={`rounded-2xl ${a.media.length > 1 ? "aspect-square object-cover" : ""}`}
                            />
                          ) : (
                            <NewsVideo key={m.id} media={m} className="col-span-full overflow-hidden rounded-2xl" />
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-8 text-ink-soft">Bu soru bu sayıda yanıtsız kaldı.</p>
            )}
          </section>
        );
      })}

      <footer className="px-6 py-12 text-center sm:px-12">
        <p className="np-headline text-3xl">Bir sonraki sayıda görüşmek üzere.</p>
        <p className="mt-2 text-ink-soft">
          {data.groupName} · Sayı {data.issueNumber} · {data.stats.answers} yanıt, {data.stats.photos} fotoğraf,{" "}
          {data.stats.videos} video
        </p>
      </footer>
    </article>
  );
}
