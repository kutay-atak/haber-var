"use client";

import { ArrowDown, ArrowUp, Dices, ExternalLink, Plus, Rocket, Save, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { saveIssue } from "@/actions/issues";
import { TemplatePicker } from "@/components/issues/template-picker";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { LocalDateTime, useIsClient } from "@/components/ui/client-time";
import { Field, Input } from "@/components/ui/field";
import { MAX_QUESTIONS_PER_ISSUE } from "@/lib/issues";
import type { BankQuestion, TemplateId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DraftQuestion {
  key: string;
  text: string;
  sourceId: string | null;
  saveToBank: boolean;
}

export interface IssueFormProps {
  groupId: string;
  issueId: string | null;
  nextNumber: number;
  initial: {
    title: string;
    deadlineAt: string;
    template: TemplateId;
    questions: Array<{ text: string; sourceId: string | null }>;
  };
  bank: BankQuestion[];
  usedIds: string[];
}

const OUR_QUESTIONS = "Bizim sorular";

/** ISO tarihini <input type="datetime-local"> biçimine (yerel saat) çevirir. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Bugünden `days` gün sonra, yerel saatle 20:00. */
function daysFromNowAt20(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

export function IssueForm({ groupId, issueId, nextNumber, initial, bank, usedIds }: IssueFormProps) {
  const router = useRouter();
  const isClient = useIsClient();
  const [pending, startTransition] = useTransition();
  const keyCounter = useRef(0);

  const [title, setTitle] = useState(initial.title);
  const [deadlineAt, setDeadlineAt] = useState(initial.deadlineAt);
  const [template, setTemplate] = useState<TemplateId>(initial.template);
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    initial.questions.map((q, i) => ({ key: `init-${i}`, text: q.text, sourceId: q.sourceId, saveToBank: false })),
  );
  const [customText, setCustomText] = useState("");
  const [saveCustom, setSaveCustom] = useState(true);
  const [category, setCategory] = useState<string>("Tümü");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const used = useMemo(() => new Set(usedIds), [usedIds]);
  const selectedIds = new Set(questions.map((q) => q.sourceId).filter(Boolean));
  const full = questions.length >= MAX_QUESTIONS_PER_ISSUE;

  const categories = useMemo(() => {
    const list = [...new Set(bank.filter((q) => !q.group_id).map((q) => q.category))];
    if (bank.some((q) => q.group_id)) list.push(OUR_QUESTIONS);
    return ["Tümü", ...list];
  }, [bank]);

  const visibleBank = bank.filter((q) => {
    if (category === OUR_QUESTIONS && !q.group_id) return false;
    if (category !== "Tümü" && category !== OUR_QUESTIONS && (q.group_id || q.category !== category)) return false;
    if (search.trim()) return q.text.toLocaleLowerCase("tr-TR").includes(search.trim().toLocaleLowerCase("tr-TR"));
    return true;
  });

  const nextKey = () => `q-${++keyCounter.current}`;

  function addFromBank(q: BankQuestion) {
    if (full || selectedIds.has(q.id)) return;
    setQuestions((list) => [...list, { key: nextKey(), text: q.text, sourceId: q.id, saveToBank: false }]);
  }

  function addCustom() {
    const text = customText.trim();
    if (text.length < 3 || full) return;
    setQuestions((list) => [...list, { key: nextKey(), text, sourceId: null, saveToBank: saveCustom }]);
    setCustomText("");
  }

  function addRandom() {
    const free = MAX_QUESTIONS_PER_ISSUE - questions.length;
    if (free <= 0) return;
    const pool = bank.filter((q) => !selectedIds.has(q.id));
    const fresh = pool.filter((q) => !used.has(q.id));
    const source = fresh.length >= Math.min(5, free) ? fresh : pool;
    const picked = [...source].sort(() => Math.random() - 0.5).slice(0, Math.min(5, free));
    setQuestions((list) => [
      ...list,
      ...picked.map((q) => ({ key: nextKey(), text: q.text, sourceId: q.id, saveToBank: false })),
    ]);
  }

  function move(index: number, delta: -1 | 1) {
    setQuestions((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  }

  function editText(key: string, text: string) {
    setQuestions((list) =>
      list.map((q) => {
        if (q.key !== key) return q;
        // Havuzdaki soru değiştirildiyse artık "kendi sorun" sayılır.
        const original = q.sourceId ? bank.find((b) => b.id === q.sourceId)?.text : undefined;
        return { ...q, text, sourceId: original !== undefined && original !== text ? null : q.sourceId };
      }),
    );
  }

  function submit(start: boolean) {
    setError(null);
    if (!questions.length) return setError("En az bir soru seç.");
    if (questions.some((q) => q.text.trim().length < 3)) return setError("Boş ya da çok kısa bir soru var.");
    if (start && new Date(deadlineAt).getTime() < Date.now() + 60 * 60 * 1000) {
      return setError("Son teslim tarihi en az 1 saat sonra olmalı.");
    }
    if (start && !window.confirm("Sayı başlasın mı? Grubundaki herkese e-posta gidecek.")) return;

    startTransition(async () => {
      const result = await saveIssue({
        groupId,
        issueId,
        title,
        deadlineAt,
        template,
        start,
        questions: questions.map((q) => ({ text: q.text.trim(), sourceId: q.sourceId, saveToBank: q.saveToBank })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/sayi/${result.issueId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-5">
        <SectionTitle>1. Temel bilgiler</SectionTitle>
        <Field label="Başlık (isteğe bağlı)" htmlFor="title" hint={`Boş bırakırsan "Sayı ${nextNumber}" yazar.`}>
          <Input
            id="title"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sonbahar sayısı 🍂"
          />
        </Field>
        <Field
          label="Son teslim"
          htmlFor="deadline"
          hint={
            isClient ? (
              <>
                Gazete <LocalDateTime iso={deadlineAt} className="font-bold text-ink" /> tarihinde yayımlanacak.
              </>
            ) : null
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="deadline"
              type="datetime-local"
              className="w-auto"
              required
              value={isClient ? toLocalInput(deadlineAt) : ""}
              onChange={(e) => {
                if (e.target.value) setDeadlineAt(new Date(e.target.value).toISOString());
              }}
            />
            {[
              { label: "3 gün", days: 3 },
              { label: "1 hafta", days: 7 },
              { label: "2 hafta", days: 14 },
            ].map((chip) => (
              <Button key={chip.days} variant="secondary" size="sm" onClick={() => setDeadlineAt(daysFromNowAt20(chip.days))}>
                {chip.label}
              </Button>
            ))}
          </div>
        </Field>
      </Card>

      <Card className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle>
            2. Sorular{" "}
            <span className="text-base font-bold text-ink-soft">
              ({questions.length}/{MAX_QUESTIONS_PER_ISSUE})
            </span>
          </SectionTitle>
          <Button variant="secondary" size="sm" onClick={addRandom} disabled={full}>
            <Dices className="size-4" aria-hidden="true" /> Rastgele 5 soru
          </Button>
        </div>

        {questions.length ? (
          <ol className="space-y-2.5">
            {questions.map((q, i) => (
              <li key={q.key} className="flex items-start gap-2 rounded-2xl border border-line bg-white p-2.5 pl-3.5">
                <span className="mt-2 font-hand text-2xl leading-none text-terracotta-deep">{i + 1}.</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <Input
                    aria-label={`${i + 1}. soru`}
                    value={q.text}
                    maxLength={300}
                    onChange={(e) => editText(q.key, e.target.value)}
                    className="border-transparent bg-transparent px-2 py-1.5 font-semibold focus:bg-white"
                  />
                  {q.saveToBank ? <p className="px-2 text-xs font-bold text-sage-deep">Grubun soru havuzuna da kaydedilecek</p> : null}
                </div>
                <div className="flex shrink-0 items-center">
                  <Button variant="ghost" size="sm" className="px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı taşı">
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    onClick={() => move(i, 1)}
                    disabled={i === questions.length - 1}
                    aria-label="Aşağı taşı"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-[#8e2a20]"
                    onClick={() => setQuestions((list) => list.filter((x) => x.key !== q.key))}
                    aria-label="Soruyu çıkar"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-line px-5 py-6 text-center text-ink-soft">
            Aşağıdaki havuzdan soru seç ya da kendi sorunu yaz. 3-5 soru idealdir.
          </p>
        )}

        <div className="rounded-2xl bg-sand/70 p-4">
          <label htmlFor="custom-question" className="text-sm font-bold">
            Kendi sorunu yaz
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="custom-question"
              value={customText}
              maxLength={300}
              placeholder="Bu ay en çok neye güldün?"
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <Button onClick={addCustom} disabled={full || customText.trim().length < 3}>
              <Plus className="size-4" aria-hidden="true" /> Ekle
            </Button>
          </div>
          <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <input
              type="checkbox"
              checked={saveCustom}
              onChange={(e) => setSaveCustom(e.target.checked)}
              className="size-4 accent-[#b4523a]"
            />
            Grubun soru havuzuna da kaydet
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Soru havuzu</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Kategoriler">
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
                {c}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
            <Input
              aria-label="Soru ara"
              placeholder="Soru ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
            {visibleBank.map((q) => {
              const selected = selectedIds.has(q.id);
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => addFromBank(q)}
                    disabled={selected || full}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                      selected
                        ? "border-sage/50 bg-sage-soft text-sage-deep"
                        : "border-line bg-white hover:border-terracotta/50 hover:shadow-soft disabled:opacity-60",
                    )}
                  >
                    <span className="min-w-0 flex-1 font-semibold">{q.text}</span>
                    {used.has(q.id) && !selected ? <Badge tone="neutral">Daha önce soruldu</Badge> : null}
                    {selected ? <Badge tone="sage">Eklendi</Badge> : <Plus className="size-5 shrink-0 text-terracotta-deep" aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
            {!visibleBank.length ? <li className="px-2 py-4 text-ink-soft">Bu aramaya uygun soru yok.</li> : null}
          </ul>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>3. Gazete şablonu</SectionTitle>
          <Link
            href="/sablonlar"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-terracotta-deep hover:underline"
          >
            Şablonları önizle <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <TemplatePicker name="template" value={template} onChange={setTemplate} />
        <p className="text-sm text-ink-soft">
          Renkler, yazı tipleri, kâğıt dokusu, fotoğraf filtreleri, editörün notu ve diğer ayarlar için sayıyı kaydettikten
          sonra sayfasındaki <strong>🎨 Gazete tasarımı</strong> stüdyosunu kullan. Okurlar gazeteyi diğer şablonlarla da
          açabilir.
        </p>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-[1.75rem] border border-line bg-paper/95 p-3 shadow-lift backdrop-blur">
        <p className="mr-auto hidden px-2 text-sm text-ink-soft sm:block">Başlatınca herkese e-posta gider.</p>
        <Button variant="secondary" onClick={() => submit(false)} disabled={pending}>
          <Save className="size-4" aria-hidden="true" /> Taslak olarak kaydet
        </Button>
        <Button onClick={() => submit(true)} disabled={pending}>
          <Rocket className="size-4" aria-hidden="true" /> {pending ? "Kaydediliyor…" : "Sayıyı başlat"}
        </Button>
      </div>
    </div>
  );
}
