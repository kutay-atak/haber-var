"use client";

import { TEMPLATE_IDS, TEMPLATES } from "@/lib/issues";
import type { TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Şablonun küçük bir minyatür önizlemesi (sadece CSS). */
function Thumb({ id }: { id: TemplateId }) {
  if (id === "classic") {
    return (
      <div className="h-24 rounded-xl border border-[#d8cfbf] bg-[#fbf7ee] p-2.5">
        <div className="border-y-2 border-double border-[#23242f]/70 py-0.5 text-center font-display text-[0.7rem] font-black uppercase tracking-wider text-[#23242f]">
          Gazete
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
  }
  if (id === "magazine") {
    return (
      <div className="relative h-24 overflow-hidden rounded-xl bg-gradient-to-br from-terracotta to-mustard p-2.5">
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" />
        <p className="relative font-display text-lg font-semibold italic leading-none text-white">Dergi</p>
        <div className="absolute bottom-2.5 left-2.5 right-2.5 space-y-1">
          <div className="h-1 w-3/4 rounded bg-white/80" />
          <div className="h-1 w-1/2 rounded bg-white/60" />
        </div>
      </div>
    );
  }
  return (
    <div className="relative h-24 overflow-hidden rounded-xl bg-[#f7efe1] p-2.5 [background-image:repeating-linear-gradient(transparent_0_11px,rgb(120_150_180/0.25)_11px_12px)]">
      <p className="font-hand text-xl leading-none">Defter</p>
      <div className="absolute bottom-2 right-3 h-12 w-11 rotate-6 bg-white p-1 pb-3 shadow">
        <div className="h-full bg-sky/70" />
      </div>
      <div className="absolute bottom-4 left-4 h-8 w-12 -rotate-3 rounded-sm bg-mustard/80" />
    </div>
  );
}

export function TemplatePicker({
  name,
  value,
  defaultValue,
  onChange,
}: {
  name: string;
  value?: TemplateId;
  defaultValue?: TemplateId;
  onChange?: (value: TemplateId) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {TEMPLATE_IDS.map((id) => {
        const t = TEMPLATES[id];
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
                "h-full rounded-2xl border-2 border-line bg-white p-3 transition",
                "group-hover:border-terracotta/40 peer-checked:border-terracotta-deep peer-checked:shadow-lift",
                "peer-focus-visible:ring-4 peer-focus-visible:ring-terracotta/25",
              )}
            >
              <Thumb id={id} />
              <p className="mt-2.5 font-bold">
                {t.emoji} {t.name}
              </p>
              <p className="text-sm leading-snug text-ink-soft">{t.description}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
