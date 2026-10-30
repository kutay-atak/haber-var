import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/lib/i18n-server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-7xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="mt-4 text-4xl font-semibold">{t("Bu sayfa kaybolmuş", "This page got lost")}</h1>
      <p className="mt-2 max-w-md text-lg text-ink-soft">
        {t(
          "Aradığın sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir. Belki de bu gruba üye değilsindir.",
          "The page you're looking for may have moved, been deleted or never existed. Or maybe you're not a member of this group.",
        )}
      </p>
      <ButtonLink href="/gruplar" className="mt-8" size="lg">
        {t("Gruplarıma dön", "Back to my groups")}
      </ButtonLink>
    </main>
  );
}
