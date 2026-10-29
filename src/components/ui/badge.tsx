import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  terracotta: "bg-terracotta-soft text-terracotta-ink",
  sage: "bg-sage-soft text-sage-deep",
  mustard: "bg-mustard-soft text-mustard-ink",
  sky: "bg-sky-soft text-sky-ink",
  neutral: "bg-sand text-ink-soft",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
