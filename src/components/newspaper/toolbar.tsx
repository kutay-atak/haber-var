import { Palette } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import type { TemplateId } from "@/lib/types";
import { PrintButton } from "./print-button";
import { TemplateSelect } from "./template-select";

/** Gazetenin üstündeki araç çubuğu: şablon seçimi, (yöneticiye) stüdyo, yazdır. Baskıda gizlenir. */
export function NewspaperToolbar({
  basePath,
  template,
  back,
  studioHref,
}: {
  basePath: string;
  template: TemplateId;
  back?: { href: string; label: string };
  studioHref?: string;
}) {
  return (
    <div className="no-print mx-auto mb-6 flex max-w-6xl flex-wrap items-center justify-between gap-3">
      {back ? (
        <Link href={back.href} className="text-sm font-bold text-ink-soft hover:text-ink">
          ← {back.label}
        </Link>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <TemplateSelect basePath={basePath} template={template} />
        {studioHref ? (
          <Link href={studioHref} className={buttonClasses({ variant: "primary" })}>
            <Palette className="size-4" aria-hidden="true" /> Tasarımı düzenle
          </Link>
        ) : null}
        <PrintButton />
      </div>
    </div>
  );
}
