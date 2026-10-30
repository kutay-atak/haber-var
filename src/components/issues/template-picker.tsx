"use client";

import { TEMPLATE_IDS, TEMPLATES, templateText } from "@/lib/issues";
import type { TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/i18n";
import { translator } from "@/lib/i18n";

/** Her şablonun küçük, sadece CSS ile çizilmiş minyatürü. */
export function TemplateThumb({ id, className }: { id: TemplateId; className?: string }) {
  const t = translator(useLocale());
  const base = cn("relative h-24 overflow-hidden rounded-xl", className);
  switch (id) {
    case "classic":
      return (
        <div className={cn(base, "border border-[#d8cfbf] bg-[#fbf7ee] p-2.5")}>
          <div className="border-y-2 border-double border-[#23242f]/70 py-0.5 text-center font-display text-[0.7rem] font-black uppercase tracking-wider text-[#23242f]">
            {t("Gazete", "Gazette")}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <div className="col-span-1 h-9 rounded-sm bg-[#23242f]/20" />
            <div className="col-span-2 space-y-1">
              <div className="h-1 rounded bg-[#23242f]/30" />
              <div className="h-1 rounded bg-[#23242f]/30" />
              <div className="h-1 rounded bg-[#23242f]/30" />
              <div className="h-1 w-2/3 rounded bg-[#23242f]/30" />
            </div>
          </div>
        </div>
      );
    case "magazine":
      return (
        <div className={cn(base, "bg-gradient-to-br from-terracotta to-mustard p-2.5")}>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />
          <p className="relative font-display text-lg font-semibold italic leading-none text-white">{t("Dergi", "Magazine")}</p>
          <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1">
            <div className="h-1 w-3/4 rounded bg-white/80" />
            <div className="h-1 w-1/2 rounded bg-white/60" />
          </div>
        </div>
      );
    case "scrapbook":
      return (
        <div className={cn(base, "bg-[#f7efe1] p-2.5 [background-image:repeating-linear-gradient(transparent_0_11px,rgb(120_150_180/0.25)_11px_12px)]")}>
          <p className="font-hand text-xl leading-none text-[#3a3346]">{t("Defter", "Scrapbook")}</p>
          <div className="absolute bottom-2 right-3 h-12 w-11 rotate-6 bg-white p-1 pb-3 shadow">
            <div className="h-full bg-sky/70" />
          </div>
          <div className="absolute bottom-4 left-4 h-8 w-12 -rotate-3 rounded-sm bg-mustard/80" />
        </div>
      );
    case "letter":
      return (
        <div
          className={cn(base, "bg-[#fbf6ea] p-2.5")}
          style={{ boxShadow: "inset 0 0 0 4px #fbf6ea, inset 0 0 0 7px #ab3428" }}
        >
          <p className="font-hand text-xl leading-none text-[#24324f]">{t("Mektup", "Letter")}</p>
          <div className="absolute right-2.5 top-2.5 flex size-9 items-center justify-center border-2 border-dotted border-[#fbf6ea] bg-[#ab3428] text-[0.6rem] font-bold text-white outline outline-2 outline-white">
            7
          </div>
          <div className="absolute bottom-3 left-3 right-10 space-y-1.5">
            <div className="h-0.5 rounded bg-[#24324f]/30" />
            <div className="h-0.5 rounded bg-[#24324f]/30" />
            <div className="h-0.5 w-2/3 rounded bg-[#24324f]/30" />
          </div>
        </div>
      );
    case "album":
      return (
        <div className={cn(base, "bg-[#f6f0e7] p-2")}>
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-1">
            <div className="col-span-2 row-span-2 rounded-md bg-gradient-to-br from-sky to-sage" />
            <div className="rounded-md bg-gradient-to-br from-mustard to-terracotta" />
            <div className="rounded-md bg-gradient-to-br from-blush to-[#c08d5d]" />
          </div>
        </div>
      );
    case "minimal":
      return (
        <div className={cn(base, "border border-line bg-white p-3")}>
          <p className="text-[0.55rem] font-bold tracking-widest text-[#111]">01</p>
          <p className="mt-0.5 text-sm font-extrabold leading-none tracking-tight text-[#111]">{t("Sade", "Minimal")}</p>
          <div className="mt-2 h-px bg-[#111]" />
          <div className="mt-2 space-y-1">
            <div className="h-1 w-5/6 rounded bg-[#111]/15" />
            <div className="h-1 w-2/3 rounded bg-[#111]/15" />
          </div>
        </div>
      );
    case "night":
      return (
        <div className={cn(base, "bg-[#151823] p-2.5 [background-image:radial-gradient(rgb(241_238_230/0.12)_1px,transparent_1.3px)] [background-size:10px_10px]")}>
          <p className="text-sm font-black uppercase leading-none tracking-wide text-[#f1eee6] [text-shadow:0_0_10px_rgb(242_204_143/0.7)]">
            {t("Gece", "Night")}
          </p>
          <div className="mt-1.5 h-0.5 w-10 rounded-full bg-gradient-to-r from-[#f2cc8f] to-[#f08a6c]" />
          <div className="absolute bottom-2.5 left-2.5 right-2.5 grid grid-cols-2 gap-1.5">
            <div className="h-7 rounded-md border border-[#2c3143] bg-[#1e2231]" />
            <div className="h-7 rounded-md border border-[#2c3143] bg-[#1e2231]" />
          </div>
        </div>
      );
    case "tabloid":
      return (
        <div className={cn(base, "border border-line bg-white")}>
          <div className="bg-[#c81e1e] px-2 py-1 text-center text-sm font-black uppercase leading-none tracking-tight text-white">{t("Bulvar", "Tabloid")}</div>
          <div className="bg-[#ffd60a] py-0.5 text-center text-[0.5rem] font-black uppercase tracking-widest text-[#111]">{t("Son dakika", "Breaking")}</div>
          <div className="m-2 h-8 border-2 border-[#111] bg-gradient-to-br from-sky to-sage" />
        </div>
      );
    case "retro":
      return (
        <div className={cn(base, "bg-[#fbf0dc]")}>
          <div
            className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: "repeating-conic-gradient(rgb(232 163 61 / 0.55) 0deg 12deg, transparent 12deg 24deg)" }}
          />
          <p className="relative mt-7 text-center font-display text-xl font-black italic leading-none text-[#a84716] [text-shadow:2px_2px_0_#e8a33d]">
            Retro
          </p>
        </div>
      );
  }
}

export function TemplatePicker({
  name,
  value,
  defaultValue,
  onChange,
  compact = false,
}: {
  name: string;
  value?: TemplateId;
  defaultValue?: TemplateId;
  onChange?: (value: TemplateId) => void;
  compact?: boolean;
}) {
  const locale = useLocale();
  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-2 @md:grid-cols-3" : "sm:grid-cols-3")}>
      {TEMPLATE_IDS.map((id) => {
        const t = { ...TEMPLATES[id], ...templateText(id, locale) };
        return (
          <label key={id} className="group relative block cursor-pointer">
            <input
              type="radio"
              name={name}
              value={id}
              className="peer sr-only"
              {...(value !== undefined ? { checked: value === id } : { defaultChecked: defaultValue === id })}
              onChange={() => onChange?.(id)}
            />
            <div
              className={cn(
                "h-full rounded-2xl border-2 border-line bg-white transition",
                compact ? "p-2" : "p-3",
                "group-hover:border-terracotta/40 peer-checked:border-terracotta-deep peer-checked:shadow-lift",
                "peer-focus-visible:ring-4 peer-focus-visible:ring-terracotta/25",
              )}
            >
              <TemplateThumb id={id} className={compact ? "h-16" : undefined} />
              <p className={cn("font-bold", compact ? "mt-1.5 text-sm" : "mt-2.5")}>
                {t.emoji} {t.name}
              </p>
              {compact ? null : <p className="text-sm leading-snug text-ink-soft">{t.description}</p>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
