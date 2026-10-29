import { ArrowRight, Camera, Newspaper, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

const STEPS = [
  {
    Icon: Users,
    tone: "bg-terracotta-soft text-terracotta-ink",
    title: "Grubunu kur",
    text: "Bir grup aç, davet linkini WhatsApp'tan paylaş. Arkadaşların tek tıkla katılsın.",
  },
  {
    Icon: Camera,
    tone: "bg-sage-soft text-sage-deep",
    title: "Herkes yanıtlasın",
    text: "Soruları sen seç ya da havuzdan çek. Herkes yazar, fotoğraf ve kısa video ekler.",
  },
  {
    Icon: Newspaper,
    tone: "bg-mustard-soft text-mustard-ink",
    title: "Gazete çıksın",
    text: "Süre dolunca tüm yanıtlar gazete, dergi ya da karalama defteri olarak yayımlanır.",
  },
];

function PaperStack() {
  return (
    <div className="relative mx-auto h-80 w-full max-w-sm sm:h-96" aria-hidden="true">
      <div
        className="absolute left-2 top-10 w-60 animate-float rounded-2xl border border-line bg-[#fbf7ee] p-4 shadow-lift [--tilt:-8deg] sm:w-64"
        style={{ animationDelay: "-2s" }}
      >
        <p className="border-y-2 border-double border-ink/60 py-1 text-center font-display text-lg font-black uppercase tracking-wider">
          Kuzenler
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-16 rounded bg-ink/10" />
          <div className="space-y-1.5">
            <div className="h-1.5 rounded bg-ink/20" />
            <div className="h-1.5 rounded bg-ink/20" />
            <div className="h-1.5 w-2/3 rounded bg-ink/20" />
          </div>
        </div>
      </div>
      <div
        className="absolute right-0 top-0 w-56 animate-float rounded-2xl bg-white p-3 shadow-lift [--tilt:7deg] sm:w-60"
        style={{ animationDelay: "-4s" }}
      >
        <div className="h-28 rounded-xl bg-gradient-to-br from-terracotta to-mustard" />
        <p className="mt-2 font-display text-xl font-semibold">Sonbahar sayısı</p>
        <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">Sayı 7 · Dergi</p>
      </div>
      <div className="absolute bottom-0 left-1/2 w-56 -translate-x-1/2 animate-float rounded-xl bg-[#f7efe1] p-3 shadow-lift [--tilt:-2deg] sm:w-60">
        <div className="np-polaroid -rotate-3">
          <div className="h-24 bg-gradient-to-br from-sky to-sage" />
        </div>
        <p className="mt-2 text-center font-hand text-2xl">Pencereden manzara ☀️</p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = isSupabaseConfigured ? await getSessionUser().catch(() => null) : null;
  if (user) redirect("/gruplar");

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Link href="/giris" className="rounded-full px-4 py-2 font-bold text-ink-soft transition hover:bg-sand hover:text-ink">
          Giriş yap
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <section className="grid items-center gap-12 py-10 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div className="space-y-7">
            <p className="font-hand text-2xl text-terracotta-deep">Uzaktaki dostlar için ✉️</p>
            <h1 className="text-4xl font-semibold leading-[1.08] sm:text-6xl">
              Arkadaşlarınla <span className="marker">ayda bir</span> gazete çıkarın.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
              Herkes aynı soruları yanıtlar; fotoğraflar, kısa videolar, küçük itiraflar… Süre dolunca hepsi tek bir
              gazetede buluşur. Grup sohbetinde kaybolup giden haberlere son.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/kayit" size="lg">
                Ücretsiz başla <ArrowRight className="size-5" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/sablonlar" variant="secondary" size="lg">
                Örnek gazeteye bak
              </ButtonLink>
            </div>
            {!isSupabaseConfigured ? (
              <p className="max-w-xl rounded-2xl bg-mustard-soft px-4 py-3 text-sm font-semibold text-mustard-ink">
                Kurulum henüz tamamlanmamış: <code>.env.local</code> dosyasını doldurduktan sonra giriş ve kayıt çalışır
                (README.md dosyasındaki adımlara bak).
              </p>
            ) : null}
          </div>
          <PaperStack />
        </section>

        <section className="pb-20">
          <h2 className="mb-8 text-center text-3xl font-semibold">Nasıl çalışır?</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {STEPS.map(({ Icon, tone, title, text }, i) => (
              <li key={title} className="rounded-[1.75rem] border border-line/80 bg-paper p-6 shadow-soft">
                <div className="mb-4 flex items-center gap-3">
                  <span className={`inline-flex size-12 items-center justify-center rounded-2xl ${tone}`}>
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="font-hand text-3xl text-ink-soft">{i + 1}.</span>
                </div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-1.5 text-ink-soft">{text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-line/70 px-4 py-8 text-center text-sm text-ink-soft">
        <span className="font-hand text-xl text-ink">Haber Var</span> · tamamen ücretsiz, reklamsız, sadece sizin için 💌
      </footer>
    </div>
  );
}
