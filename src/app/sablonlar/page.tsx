import type { Metadata } from "next";
import Link from "next/link";
import { DesignStudio } from "@/components/design/design-studio";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { demoNewspaper } from "@/lib/demo-newspaper";
import { DEFAULT_DESIGN } from "@/lib/design";
import { templateFromSlug } from "@/lib/issues";
import { translator } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n-server";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Gazete şablonları", "Newspaper templates"),
    description: t(
      "Dokuz şablon ve onlarca ayarla örnek bir Haber Var sayısını kendin tasarla.",
      "Design a sample Haber Var issue yourself with nine templates and dozens of settings.",
    ),
  };
}

// Herkese açık deneme stüdyosu: hiçbir şey kaydedilmez.
export default async function TemplatesPage({ searchParams }: PageProps<"/sablonlar">) {
  const { gorunum } = await searchParams;
  const locale = await getLocale();
  const t = translator(locale);
  const demo = demoNewspaper(locale);
  return (
    <div className="flex-1">
      <header className="no-print mx-auto flex w-full max-w-[100rem] items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Haber Var">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ButtonLink href="/giris" variant="ghost" size="sm">
            {t("Giriş yap", "Log in")}
          </ButtonLink>
        </div>
      </header>
      <DesignStudio
        mode="demo"
        targetId={null}
        initialTemplate={templateFromSlug(gorunum) ?? "classic"}
        initialDesign={DEFAULT_DESIGN}
        data={demo}
        sampleNotice={`${t("Örnek bir sayı", "A sample issue")}: ${demo.groupName}`}
      />
    </div>
  );
}
