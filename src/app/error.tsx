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
      <h1 className="text-4xl font-semibold">{t("Bir şeyler ters gitti", "Something went wrong")}</h1>
      <p className="mt-2 max-w-md text-lg text-ink-soft">
        {isSetupProblem
          ? error.message
          : t(
              "Sayfayı yenileyip tekrar dene.",
              "Refresh the page and try again.",
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
