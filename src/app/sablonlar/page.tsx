import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "@/components/newspaper/newspaper";
import { NewspaperToolbar } from "@/components/newspaper/toolbar";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { DEMO_NEWSPAPER } from "@/lib/demo-newspaper";
import { templateFromSlug } from "@/lib/issues";

export const metadata: Metadata = {
  title: "Gazete şablonları",
  description: "Klasik Gazete, Modern Dergi ve Karalama Defteri şablonlarıyla örnek bir Haber Var sayısı.",
};

export default async function TemplatesPage({ searchParams }: PageProps<"/sablonlar">) {
  const { gorunum } = await searchParams;
  const template = templateFromSlug(gorunum) ?? "classic";

  return (
    <div className="flex-1">
      <header className="no-print mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" aria-label="Haber Var ana sayfa">
          <Logo />
        </Link>
        <ButtonLink href="/kayit" size="sm">
          Kendi gazeteni başlat
        </ButtonLink>
      </header>
      <main className="px-3 pb-16 pt-2 sm:px-6">
        <div className="no-print mx-auto mb-6 max-w-6xl">
          <h1 className="text-3xl font-semibold sm:text-4xl">Örnek bir sayı</h1>
          <p className="mt-1 text-ink-soft">
            Aynı yanıtlar, üç farklı görünüm. Aşağıdaki düğmelerle şablonlar arasında geçiş yapabilirsin.
          </p>
        </div>
        <NewspaperToolbar basePath="/sablonlar" template={template} />
        <Newspaper data={DEMO_NEWSPAPER} template={template} />
      </main>
    </div>
  );
}
