import { ArrowRight, Camera, Newspaper, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { getSessionUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getT } from "@/lib/i18n-server";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { T } from "@/lib/i18n";

const steps = (t: T) => [
  {
    Icon: Users,
    tone: "bg-terracotta-soft text-terracotta-ink",
    title: t("Grubunu kur", "Start a group"),
    text: t(
      "Bir grup aç, davet linkini WhatsApp'tan paylaş. Arkadaşların tek tıkla katılsın.",
      "Create a group and share the invite link on WhatsApp. Your friends join with one tap.",
    ),
  },
  {
    Icon: Camera,
    tone: "bg-sage-soft text-sage-deep",
    title: t("Herkes yanıtlasın", "Everyone answers"),
    text: t(
      "Soruları sen seç ya da havuzdan çek. Herkes yazar, fotoğraf ve kısa video ekler.",
      "Pick the questions yourself or draw from the pool. Everyone writes and adds photos and short videos.",
    ),
  },
  {
    Icon: Newspaper,
    tone: "bg-mustard-soft text-mustard-ink",
    title: t("Gazete çıksın", "The paper comes out"),
    text: t(
      "Süre dolunca tüm yanıtlar gazete, dergi ya da karalama defteri olarak yayımlanır.",
      "When time is up, all the answers are published as a newspaper, a magazine or a scrapbook.",
    ),
  },
];

function PaperStack({ t }: { t: T }) {
  return (
    <div className="relative mx-auto h-80 w-full max-w-sm sm:h-96" aria-hidden="true">
      <div
        className="absolute left-2 top-10 w-60 animate-float rounded-2xl border border-line bg-[#fbf7ee] p-4 shadow-lift [--tilt:-8deg] sm:w-64"
        style={{ animationDelay: "-2s" }}
      >
        <p className="border-y-2 border-double border-ink/60 py-1 text-center font-display text-lg font-black uppercase tracking-wider">
          {t("Kuzenler", "Cousins")}
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
        <p className="mt-2 font-display text-xl font-semibold">{t("Sonbahar sayısı", "The autumn issue")}</p>
        <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">{t("Sayı 7 · Dergi", "Issue 7 · Magazine")}</p>
      </div>
      <div className="absolute bottom-0 left-1/2 w-56 -translate-x-1/2 animate-float rounded-xl bg-[#f7efe1] p-3 shadow-lift [--tilt:-2deg] sm:w-60">
        <div className="np-polaroid -rotate-3">
          <div className="h-24 bg-gradient-to-br from-sky to-sage" />
        </div>
        <p className="mt-2 text-center font-hand text-2xl">{t("Pencereden manzara", "The view from my window")} ☀️</p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const user = isSupabaseConfigured ? await getSessionUser().catch(() => null) : null;
  if (user) redirect("/gruplar");
  const t = await getT();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/giris" className="rounded-full px-4 py-2 font-bold text-ink-soft transition hover:bg-sand hover:text-ink">
            {t("Giriş yap", "Log in")}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6">
        <section className="grid items-center gap-12 py-10 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div className="space-y-7">
            <p className="font-hand text-2xl text-terracotta-deep">{t("Uzaktaki dostlar için", "For friends far away")} ✉️</p>
            <h1 className="text-4xl font-semibold leading-[1.08] sm:text-6xl">
              {t("Arkadaşlarınla", "Put out a newspaper with your friends")}{" "}
              <span className="marker">{t("ayda bir", "once a month")}</span>
              {t(" gazete çıkarın.", ".")}
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
              {t(
                "Herkes aynı soruları yanıtlar; fotoğraflar, kısa videolar, küçük itiraflar… Süre dolunca hepsi tek bir gazetede buluşur. Grup sohbetinde kaybolup giden haberlere son.",
                "Everyone answers the same questions: photos, short videos, little confessions… When time is up, it all comes together in one newspaper. No more news lost in the group chat.",
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/kayit" size="lg">
                {t("Ücretsiz başla", "Start for free")} <ArrowRight className="size-5" aria-hidden="true" />
              </ButtonLink>
              <ButtonLink href="/sablonlar" variant="secondary" size="lg">
                {t("Örnek gazeteye bak", "See a sample newspaper")}
              </ButtonLink>
            </div>
            {!isSupabaseConfigured ? (
              <p className="max-w-xl rounded-2xl bg-mustard-soft px-4 py-3 text-sm font-semibold text-mustard-ink">
                {t("Kurulum henüz tamamlanmamış:", "Setup isn't finished yet:")} <code>.env.local</code>{" "}
                {t(
                  "dosyasını doldurduktan sonra giriş ve kayıt çalışır (Instructions.md dosyasındaki adımlara bak).",
                  "needs to be filled in before login and sign-up work (see the steps in Instructions.md).",
                )}
              </p>
            ) : null}
          </div>
          <PaperStack t={t} />
        </section>

        <section className="pb-20">
          <h2 className="mb-8 text-center text-3xl font-semibold">{t("Nasıl çalışır?", "How it works")}</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {steps(t).map(({ Icon, tone, title, text }, i) => (
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
        <span className="font-hand text-xl text-ink">Haber Var</span> ·{" "}
        {t("tamamen ücretsiz, reklamsız", "completely free, no ads")}
      </footer>
    </div>
  );
}
