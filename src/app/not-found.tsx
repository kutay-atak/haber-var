import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/lib/i18n-server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-7xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="mt-4 text-4xl font-semibold">{t("Sayfa bulunamadı", "Page not found")}</h1>
      <p className="mt-2 max-w-md text-lg text-ink-soft">
        {t(
          "Bu sayfa yok ya da görme iznin yok.",
          "This page doesn't exist or you don't have access to it.",
        )}
      </p>
      <ButtonLink href="/gruplar" className="mt-8" size="lg">
        {t("Gruplarıma dön", "Back to my groups")}
      </ButtonLink>
    </main>
  );
}
