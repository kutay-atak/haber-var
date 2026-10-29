import Link from "next/link";
import { PrintButton } from "./print-button";
import { TEMPLATE_IDS, TEMPLATES } from "@/lib/issues";
import type { TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Gazetenin üstündeki şablon değiştirici ve yazdır butonu (baskıda gizlenir). */
export function NewspaperToolbar({
  basePath,
  template,
  back,
}: {
  basePath: string;
  template: TemplateId;
  back?: { href: string; label: string };
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
        <nav aria-label="Görünüm" className="flex flex-wrap gap-1 rounded-full border border-line bg-paper p-1 shadow-soft">
          {TEMPLATE_IDS.map((id) => (
            <Link
              key={id}
              href={`${basePath}?gorunum=${TEMPLATES[id].slug}`}
              scroll={false}
              aria-current={id === template ? "page" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-bold transition",
                id === template ? "bg-ink text-white" : "text-ink-soft hover:bg-sand hover:text-ink",
              )}
            >
              <span aria-hidden="true">{TEMPLATES[id].emoji}</span> {TEMPLATES[id].name}
            </Link>
          ))}
        </nav>
        <PrintButton />
      </div>
    </div>
  );
}
