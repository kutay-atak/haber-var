"use client";

import { useT } from "@/components/i18n";
import type { QuestionKind } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Anket ve "kim daha çok?" soruları için küçük etiket (yazılı sorularda hiçbir şey göstermez). */
export function QuestionKindBadge({ kind, className }: { kind: QuestionKind; className?: string }) {
  const t = useT();
  if (kind === "text") return null;
  return (
    <span className={cn("whitespace-nowrap rounded-full bg-mustard-soft px-2 py-0.5 text-xs font-bold text-mustard-ink", className)}>
      {kind === "poll" ? `📊 ${t("Anket", "Poll")}` : `🏆 ${t("Kim daha çok?", "Most likely to…")}`}
    </span>
  );
}

/** Anket seçeneklerini küçük çipler olarak gösterir. */
export function PollOptionsPreview({ options, className }: { options: string[] | null; className?: string }) {
  if (!options?.length) return null;
  return (
    <span className={cn("flex flex-wrap gap-1", className)}>
      {options.map((o, i) => (
        <span key={i} className="rounded-full border border-line bg-white px-2 py-0.5 text-xs font-semibold text-ink-soft">
          {o}
        </span>
      ))}
    </span>
  );
}
