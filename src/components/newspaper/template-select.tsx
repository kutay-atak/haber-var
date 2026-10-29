"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { TEMPLATE_IDS, TEMPLATES } from "@/lib/issues";
import type { TemplateId } from "@/lib/types";

/** Okurun gazeteyi başka bir şablonla görmesi için açılır liste (kayıt edilmez). */
export function TemplateSelect({ basePath, template }: { basePath: string; template: TemplateId }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 rounded-full border border-line bg-paper py-1 pl-4 pr-1 shadow-soft">
      <span className="text-sm font-bold text-ink-soft">Görünüm</span>
      <select
        value={template}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value as TemplateId;
          startTransition(() => router.replace(`${basePath}?gorunum=${TEMPLATES[next].slug}`, { scroll: false }));
        }}
        className="min-h-9 cursor-pointer rounded-full bg-sand px-3 text-sm font-bold text-ink focus:outline-none focus-visible:ring-4 focus-visible:ring-terracotta/25"
      >
        {TEMPLATE_IDS.map((id) => (
          <option key={id} value={id}>
            {TEMPLATES[id].emoji} {TEMPLATES[id].name}
          </option>
        ))}
      </select>
    </label>
  );
}
