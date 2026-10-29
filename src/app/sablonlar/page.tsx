import type { Metadata } from "next";
import Link from "next/link";
import { DesignStudio } from "@/components/design/design-studio";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { DEMO_NEWSPAPER } from "@/lib/demo-newspaper";
import { DEFAULT_DESIGN } from "@/lib/design";
import { templateFromSlug } from "@/lib/issues";

export const metadata: Metadata = {
  title: "Gazete şablonları",
  description: "Dokuz şablon ve onlarca ayarla örnek bir Haber Var sayısını kendin tasarla.",
};

// Herkese açık deneme stüdyosu: hiçbir şey kaydedilmez.
export default async function TemplatesPage({ searchParams }: PageProps<"/sablonlar">) {
  const { gorunum } = await searchParams;
  return (
    <div className="flex-1">
      <header className="no-print mx-auto flex w-full max-w-[100rem] items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Haber Var ana sayfa">
          <Logo />
        </Link>
        <ButtonLink href="/giris" variant="ghost" size="sm">
          Giriş yap
        </ButtonLink>
      </header>
      <DesignStudio
        mode="demo"
        targetId={null}
        initialTemplate={templateFromSlug(gorunum) ?? "classic"}
        initialDesign={DEFAULT_DESIGN}
        data={DEMO_NEWSPAPER}
        sampleNotice="Örnek bir sayı: Kuzenler Şubesi"
      />
    </div>
  );
}
