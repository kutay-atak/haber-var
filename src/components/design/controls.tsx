"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Tasarım stüdyosunun panel parçaları.

export function PanelSection({ title, children, defaultOpen = false }: { title: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-line bg-paper">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-bold [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown className="size-4 shrink-0 text-ink-soft transition group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-5 border-t border-line px-4 pb-5 pt-4">{children}</div>
    </details>
  );
}

export function ControlLabel({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-sm font-bold">{children}</p>
      {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function Chips<T extends string>({
  label,
  hint,
  value,
  onChange,
  options,
}: {
  label: string;
  hint?: ReactNode;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div>
      <ControlLabel hint={hint}>{label}</ControlLabel>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-9 rounded-full px-3.5 text-sm font-bold transition",
              value === o.value ? "bg-ink text-white" : "bg-sand text-ink-soft hover:bg-line hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Görsel seçenek kutucuğu (palet, doku, filtre…). */
export function Tile({
  selected,
  onClick,
  label,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group flex flex-col items-stretch gap-1.5 rounded-xl p-1.5 text-left transition",
        selected ? "bg-terracotta-soft ring-2 ring-terracotta-deep" : "hover:bg-sand",
        className,
      )}
    >
      {children}
      <span className={cn("truncate px-0.5 text-xs font-bold", selected ? "text-terracotta-ink" : "text-ink-soft")}>{label}</span>
    </button>
  );
}

export function TileGrid({ label, hint, children, cols = 3 }: { label: string; hint?: ReactNode; children: ReactNode; cols?: 3 | 4 }) {
  return (
    <div>
      <ControlLabel hint={hint}>{label}</ControlLabel>
      <div className={cn("grid gap-1.5", cols === 4 ? "grid-cols-4" : "grid-cols-3")} role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {hint ? <span className="block text-xs text-ink-soft">{hint}</span> : null}
      </span>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition peer-focus-visible:ring-4 peer-focus-visible:ring-terracotta/25",
          checked ? "bg-sage-deep" : "bg-line",
        )}
      >
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-[1.375rem]" : "left-0.5")} />
      </span>
    </label>
  );
}
