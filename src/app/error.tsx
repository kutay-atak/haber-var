"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isSetupProblem = error.message.includes("ortam değişkeni");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-7xl" aria-hidden="true">
        🙈
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Bir şeyler ters gitti</h1>
      <p className="mt-2 max-w-md text-lg text-ink-soft">
        {isSetupProblem ? error.message : "Merak etme, yazdıkların güvende. Sayfayı yeniden denemek çoğu zaman işe yarar."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          Tekrar dene
        </Button>
        <ButtonLink href="/gruplar" variant="secondary" size="lg">
          Gruplarıma dön
        </ButtonLink>
      </div>
    </main>
  );
}
