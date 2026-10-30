"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useT } from "@/components/i18n";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import type { BankQuestion } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PollOptionsPreview, QuestionKindBadge } from "./question-kind";

// Kategori listesindeki özel değerler; ekranda seçili dilde yazılır.
const ALL = "__all__";
const OUR_QUESTIONS = "__ours__";

/** Hazır soru havuzu: kategoriler, arama ve "ekle" düğmeleri. */
export function QuestionPool({
  bank,
  usedIds,
  selectedIds,
  disabled = false,
  onPick,
  heading,
}: {
  bank: BankQuestion[];
  usedIds?: ReadonlySet<string>;
  selectedIds: ReadonlySet<string>;
  disabled?: boolean;
  onPick: (question: BankQuestion) => void;
  heading?: string;
}) {
  const t = useT();
  const [category, setCategory] = useState<string>(ALL);
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    const list = [...new Set(bank.filter((q) => !q.group_id).map((q) => q.category))];
    if (bank.some((q) => q.group_id)) list.push(OUR_QUESTIONS);
    return [ALL, ...list];
  }, [bank]);

  const visible = bank.filter((q) => {
    if (category === OUR_QUESTIONS && !q.group_id) return false;
    if (category !== ALL && category !== OUR_QUESTIONS && (q.group_id || q.category !== category)) return false;
    if (search.trim()) return q.text.toLocaleLowerCase("tr-TR").includes(search.trim().toLocaleLowerCase("tr-TR"));
    return true;
  });

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">{heading ?? t("Soru havuzu", "Question pool")}</h3>
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("Kategoriler", "Categories")}>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-bold transition",
              category === c ? "bg-ink text-white" : "bg-white text-ink-soft hover:bg-sand hover:text-ink",
            )}
          >
            {c === ALL ? t("Tümü", "All") : c === OUR_QUESTIONS ? t("Bizim sorular", "Our questions") : c}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
        <Input
          aria-label={t("Soru ara", "Search questions")}
          placeholder={t("Soru ara…", "Search questions…")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
        {visible.map((q) => {
          const selected = selectedIds.has(q.id);
          return (
            <li key={q.id}>
              <button
                type="button"
                onClick={() => onPick(q)}
                disabled={selected || disabled}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                  selected
                    ? "border-sage/50 bg-sage-soft text-sage-deep"
                    : "border-line bg-white hover:border-terracotta/50 hover:shadow-soft disabled:opacity-60",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{q.text}</span> <QuestionKindBadge kind={q.kind} className="ml-1 align-middle" />
                  <PollOptionsPreview options={q.options} className="mt-1.5" />
                </span>
                {usedIds?.has(q.id) && !selected ? <Badge tone="neutral">{t("Daha önce soruldu", "Asked before")}</Badge> : null}
                {selected ? (
                  <Badge tone="sage">{t("Eklendi", "Added")}</Badge>
                ) : (
                  <Plus className="size-5 shrink-0 text-terracotta-deep" aria-hidden="true" />
                )}
              </button>
            </li>
          );
        })}
        {!visible.length ? <li className="px-2 py-4 text-ink-soft">{t("Bu aramaya uygun soru yok.", "No questions match this search.")}</li> : null}
      </ul>
    </div>
  );
}
