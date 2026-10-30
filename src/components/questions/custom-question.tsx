"use client";

import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { POLL_MAX_OPTIONS, POLL_MIN_OPTIONS } from "@/lib/questions";
import type { QuestionKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ComposedQuestion {
  text: string;
  kind: QuestionKind;
  options: string[] | null;
  saveToBank: boolean;
}

/** Kendi sorunu yaz: yazılı soru, anket (seçenekleriyle) ya da "kim daha çok?". */
export function CustomQuestion({
  disabled = false,
  onAdd,
  addLabel,
}: {
  disabled?: boolean;
  onAdd: (question: ComposedQuestion) => void | Promise<void>;
  addLabel?: string;
}) {
  const t = useT();
  const [kind, setKind] = useState<QuestionKind>("text");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [saveToBank, setSaveToBank] = useState(true);

  const filledOptions = options.map((o) => o.trim()).filter(Boolean);
  const uniqueOptions = [...new Set(filledOptions)];
  const ready = text.trim().length >= 3 && (kind !== "poll" || uniqueOptions.length >= POLL_MIN_OPTIONS);

  const kinds: Array<{ value: QuestionKind; label: string; hint: string }> = [
    { value: "text", label: `✍️ ${t("Yazılı", "Written")}`, hint: t("Herkes yazar, fotoğraf, video ya da sesli not ekler.", "Everyone writes and can add photos, video or a voice note.") },
    { value: "poll", label: `📊 ${t("Anket", "Poll")}`, hint: t("Seçenekleri sen yaz; sonuçlar grafikle gazetede çıkar.", "You write the options; results appear as charts in the newspaper.") },
    {
      value: "who",
      label: `🏆 ${t("Kim daha çok?", "Most likely to…")}`,
      hint: t("Herkes gruptan birine gizlice oy verir; gazetede kürsü çıkar.", "Everyone secretly votes for someone in the group; the newspaper shows a podium."),
    },
  ];
  const placeholder =
    kind === "poll"
      ? t("Tatil: deniz mi, dağ mı?", "Holiday: beach or mountains?")
      : kind === "who"
        ? t("Kim en çok geç kalır?", "Who is always running late?")
        : t("Bu ay en çok neye güldün?", "What made you laugh most this month?");

  async function add() {
    if (!ready || disabled) return;
    await onAdd({ text: text.trim(), kind, options: kind === "poll" ? uniqueOptions : null, saveToBank });
    setText("");
    setOptions(["", ""]);
  }

  return (
    <div className="space-y-3 rounded-2xl bg-sand/70 p-4">
      <p className="text-sm font-bold">{t("Kendi sorunu yaz", "Write your own question")}</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t("Soru tipi", "Question type")}>
        {kinds.map((k) => (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={kind === k.value}
            onClick={() => setKind(k.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-bold transition",
              kind === k.value ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-ink",
            )}
          >
            {k.label}
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-ink-soft">{kinds.find((k) => k.value === kind)?.hint}</p>

      <Input
        value={text}
        maxLength={300}
        placeholder={placeholder}
        aria-label={t("Soru", "Question")}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && kind !== "poll") {
            e.preventDefault();
            void add();
          }
        }}
      />

      {kind === "poll" ? (
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-right text-sm font-bold text-ink-soft">{i + 1}.</span>
              <Input
                value={o}
                maxLength={80}
                placeholder={t(`Seçenek ${i + 1}`, `Option ${i + 1}`)}
                aria-label={t(`Seçenek ${i + 1}`, `Option ${i + 1}`)}
                onChange={(e) => setOptions((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                className="py-2"
              />
              {options.length > POLL_MIN_OPTIONS ? (
                <button
                  type="button"
                  onClick={() => setOptions((list) => list.filter((_, j) => j !== i))}
                  className="rounded-full p-1.5 text-ink-soft hover:bg-white hover:text-[#8e2a20]"
                  aria-label={t("Seçeneği çıkar", "Remove option")}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          ))}
          {options.length < POLL_MAX_OPTIONS ? (
            <Button variant="ghost" size="sm" onClick={() => setOptions((list) => [...list, ""])}>
              <Plus className="size-4" aria-hidden="true" /> {t("Seçenek ekle", "Add option")}
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-soft">
          <input type="checkbox" checked={saveToBank} onChange={(e) => setSaveToBank(e.target.checked)} className="size-4 accent-[#b4523a]" />
          {t("Grubun soru havuzuna da kaydet", "Also save it to the group's question pool")}
        </label>
        <Button onClick={() => void add()} disabled={disabled || !ready}>
          <Plus className="size-4" aria-hidden="true" /> {addLabel ?? t("Ekle", "Add")}
        </Button>
      </div>
    </div>
  );
}
