import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  emoji,
  title,
  children,
  action,
  className,
}: {
  emoji: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[1.75rem] border-2 border-dashed border-line bg-paper/70 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-3 text-5xl" aria-hidden="true">
        {emoji}
      </span>
      <h3 className="text-xl font-semibold">{title}</h3>
      {children ? <div className="mt-2 max-w-md text-ink-soft">{children}</div> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
