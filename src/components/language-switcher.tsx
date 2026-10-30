"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocale } from "@/actions/locale";
import { useLocale } from "@/components/i18n";
import { LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LABELS: Record<Locale, { short: string; name: string }> = {
  tr: { short: "TR", name: "Türkçe" },
  en: { short: "EN", name: "English" },
};

/** Küçük TR | EN düğmesi. Seçim çereze (ve giriş yapmışsa hesaba) kaydedilir. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const current = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label={current === "en" ? "Language" : "Dil"}
      className={cn("no-print inline-flex rounded-full border border-line bg-paper p-0.5 text-xs font-extrabold", pending && "opacity-60", className)}
    >
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          lang={locale}
          title={LABELS[locale].name}
          aria-pressed={locale === current}
          disabled={pending}
          onClick={() => choose(locale)}
          className={cn(
            "rounded-full px-2.5 py-1 transition",
            locale === current ? "bg-ink text-white" : "text-ink-soft hover:text-ink",
          )}
        >
          {LABELS[locale].short}
        </button>
      ))}
    </div>
  );
}
