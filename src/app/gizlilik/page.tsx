import type { Metadata } from "next";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Gizlilik", "Privacy") };
}

// Herkese açık gizlilik sayfası. Google ile girişin yayında kalması için de gerekli.
export default async function PrivacyPage() {
  const t = await getT();
  const sections = [
    {
      title: t("Ne saklanıyor", "What is stored"),
      items: [
        t(
          "Hesabın: adın, e-posta adresin ve dil tercihin. Google ile girersen Google'dan sadece adın, e-posta adresin ve profil fotoğrafın alınır; bunlar yalnızca hesabını oluşturmak için kullanılır.",
          "Your account: your name, email address and language. If you sign in with Google, only your name, email address and profile photo are taken from Google, and they're used only to set up your account.",
        ),
        t(
          "Paylaştıkların: yanıtların, fotoğrafların, videoların, ses kayıtların, oyların, tepkilerin ve yorumların.",
          "What you share: your answers, photos, videos, voice notes, votes, reactions and comments.",
        ),
        t(
          "Bildirimler için: e-posta tercihin; telefon bildirimlerini açtıysan o cihazın bildirim adresi.",
          "For notifications: your email preference and, if you turned on phone notifications, your device's notification address.",
        ),
      ],
    },
    {
      title: t("Kim görebilir", "Who can see it"),
      items: [
        t(
          "Paylaştıklarını sadece aynı gruptaki arkadaşların görür, o da sayı yayımlanınca.",
          "Only friends in the same group see what you share, and only once the issue is published.",
        ),
        t(
          "Anketlerde kimin neyi seçtiği görünür. \"Kim daha çok?\" oylarında ise kimin kime oy verdiği hiç kimseye gösterilmez.",
          "Poll choices are shown with names. For \"Most likely to…\" votes, nobody is ever shown who voted for whom.",
        ),
        t("E-posta adresin grup arkadaşlarına gösterilmez.", "Your email address isn't shown to your group."),
        t(
          "Fotoğraf, video ve ses kayıtları tahmin edilemeyen bağlantılarla saklanır; bağlantıyı bilen biri açabilir.",
          "Photos, videos and voice notes are kept at unguessable links; anyone who has a link can open it.",
        ),
      ],
    },
    {
      title: t("Nerede saklanıyor", "Where it's kept"),
      items: [
        t("Supabase: hesaplar ve paylaşılan her şey (veritabanı).", "Supabase: accounts and everything shared (the database)."),
        t("Cloudinary: fotoğraflar, videolar ve ses kayıtları.", "Cloudinary: photos, videos and voice notes."),
        t("Vercel: sitenin çalıştığı sunucu.", "Vercel: the server the site runs on."),
        t("Gmail: bildirim e-postalarını gönderir.", "Gmail: sends the notification emails."),
        t(
          "Telefon bildirimleri tarayıcının kendi servisi (Google, Apple, Mozilla, Microsoft) üzerinden şifreli gider; bu servisler içeriği okuyamaz.",
          "Phone notifications travel encrypted through your browser's own service (Google, Apple, Mozilla, Microsoft), which can't read them.",
        ),
      ],
    },
    {
      title: t("Reklam ve takip yok", "No ads, no tracking"),
      items: [
        t(
          "Reklam yok. Verilerin satılmaz, başka bir amaçla kimseyle paylaşılmaz, ziyaretlerin takip edilmez.",
          "There are no ads. Your data isn't sold or shared for any other purpose, and your visits aren't tracked.",
        ),
        t(
          "Çerezler sadece oturumunu açık tutmak ve dil tercihini hatırlamak için kullanılır.",
          "Cookies are only used to keep you signed in and to remember your language.",
        ),
      ],
    },
    {
      title: t("Kontrol sende", "Your choices"),
      items: [
        t("E-posta ve telefon bildirimlerini profilinden kapatabilirsin.", "You can turn email and phone notifications off on your profile."),
        t(
          "Süre bitene kadar yanıtlarını değiştirebilir, yorumlarını istediğin zaman silebilirsin.",
          "You can change your answers until the deadline and delete your comments at any time.",
        ),
        t(
          "Hesabının ve paylaştıklarının tamamen silinmesini istersen grubunun yöneticisine ya da Haber Var'ı kuran kişiye yaz.",
          "To have your account and everything you shared deleted, ask your group's admin or the person who runs Haber Var.",
        ),
      ],
    },
  ];

  return (
    <div className="flex-1">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Haber Var">
          <Logo />
        </Link>
        <LanguageSwitcher />
      </header>
      <Container size="sm" className="space-y-8 pb-16">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold">{t("Gizlilik", "Privacy")}</h1>
          <p className="text-ink-soft">
            {t(
              "Haber Var, arkadaş grupları için kişisel bir gazete uygulaması. Burada neyin saklandığını ve kimin görebildiğini kısaca anlatıyoruz.",
              "Haber Var is a personal newspaper app for groups of friends. Here's, briefly, what it stores and who can see it.",
            )}
          </p>
        </div>
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-bold">{section.title}</h2>
            <ul className="list-disc space-y-2 pl-5 leading-relaxed">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
        <p className="text-sm text-ink-soft">{t("Son güncelleme: 12 Kasım 2026", "Last updated: 12 November 2026")}</p>
      </Container>
    </div>
  );
}
