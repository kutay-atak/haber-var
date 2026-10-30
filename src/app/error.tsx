"use client";

import { useEffect } from "react";
import { useT } from "@/components/i18n";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isSetupProblem = error.message.includes("ortam değişkeni");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-7xl" aria-hidden="true">
        🙈
      </p>
      <h1 className="mt-4 text-4xl font-semibold">{t("Bir şeyler ters gitti", "Something went wrong")}</h1>
      <p className="mt-2 max-w-md text-lg text-ink-soft">
        {isSetupProblem
          ? error.message
          : t(
              "Merak etme, yazdıkların güvende. Sayfayı yeniden denemek çoğu zaman işe yarar.",
              "Don't worry, what you wrote is safe. Trying the page again usually helps.",
            )}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          {t("Tekrar dene", "Try again")}
        </Button>
        <ButtonLink href="/gruplar" variant="secondary" size="lg">
          {t("Gruplarıma dön", "Back to my groups")}
        </ButtonLink>
      </div>
    </main>
  );
}
