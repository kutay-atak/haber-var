"use client";

import { ArrowDown, ArrowUp, Dices, ExternalLink, Plus, Rocket, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { saveIssue } from "@/actions/issues";
import { useT } from "@/components/i18n";
import { TemplatePicker } from "@/components/issues/template-picker";
import { CustomQuestion } from "@/components/questions/custom-question";
import { PollOptionsPreview, QuestionKindBadge } from "@/components/questions/question-kind";
import { QuestionPool } from "@/components/questions/question-pool";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { LocalDateTime, useIsClient } from "@/components/ui/client-time";
import { Field, Input } from "@/components/ui/field";
import { MAX_QUESTIONS_PER_ISSUE } from "@/lib/issues";
import type { BankQuestion, QuestionKind, QueuedQuestion, TemplateId } from "@/lib/types";

interface DraftQuestion {
  key: string;
  text: string;
  kind: QuestionKind;
  options: string[] | null;
  sourceId: string | null;
  saveToBank: boolean;
  /** Editörlerin sırasından geldiyse sıradaki kaydı */
  queueId: string | null;
  /** Soruyu öneren editör */
  askedBy: string | null;
}

export interface IssueFormProps {
  groupId: string;
  issueId: string | null;
  nextNumber: number;
  initial: {
    title: string;
    deadlineAt: string;
    template: TemplateId;
    questions: Array<{
      text: string;
      sourceId: string | null;
      kind: QuestionKind;
      options: string[] | null;
      askedBy: string | null;
    }>;
  };
  bank: BankQuestion[];
  usedIds: string[];
  /** Editörlerin sıradaki sayı için önerdiği sorular */
  queue: QueuedQuestion[];
  /** Soru önerenlerin adları (kimlik → ad) */
  people: Record<string, { name: string; avatarUrl: string | null }>;
}

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

const fromQueue = (q: QueuedQuestion): Omit<DraftQuestion, "key"> => ({
  text: q.text,
  kind: q.kind,
  options: q.options,
  sourceId: q.source_question_id,
  saveToBank: false,
  queueId: q.id,
  askedBy: q.added_by,
});

export function IssueForm({ groupId, issueId, nextNumber, initial, bank, usedIds, queue, people }: IssueFormProps) {
  const router = useRouter();
  const isClient = useIsClient();
  const [pending, startTransition] = useTransition();
  const keyCounter = useRef(0);
  const t = useT();

  const [title, setTitle] = useState(initial.title);
  const [deadlineAt, setDeadlineAt] = useState(initial.deadlineAt);
  const [template, setTemplate] = useState<TemplateId>(initial.template);
  // Yeni sayıda editörlerin önerileri baştan eklenir; istemediğin çıkarılabilir (sırada kalır).
  const [questions, setQuestions] = useState<DraftQuestion[]>(() =>
    issueId
      ? initial.questions.map((q, i) => ({ ...q, key: `init-${i}`, saveToBank: false, queueId: null }))
      : queue.slice(0, MAX_QUESTIONS_PER_ISSUE).map((q, i) => ({ ...fromQueue(q), key: `queue-${i}` })),
  );
  const [error, setError] = useState<string | null>(null);

  const used = useMemo(() => new Set(usedIds), [usedIds]);
  const selectedIds = new Set(questions.map((q) => q.sourceId).filter((id): id is string => !!id));
  const queuedInForm = new Set(questions.map((q) => q.queueId).filter(Boolean));
  const waitingQueue = queue.filter((q) => !queuedInForm.has(q.id));
  const full = questions.length >= MAX_QUESTIONS_PER_ISSUE;

  const nextKey = () => `q-${++keyCounter.current}`;
  function add(q: Omit<DraftQuestion, "key">) {
    setQuestions((list) => (list.length >= MAX_QUESTIONS_PER_ISSUE ? list : [...list, { ...q, key: nextKey() }]));
  }

  function addFromBank(q: BankQuestion) {
    if (full || selectedIds.has(q.id)) return;
    add({ text: q.text, kind: q.kind, options: q.options, sourceId: q.id, saveToBank: false, queueId: null, askedBy: null });
  }

  function addRandom() {
    const free = MAX_QUESTIONS_PER_ISSUE - questions.length;
    if (free <= 0) return;
    const pool = bank.filter((q) => !selectedIds.has(q.id));
    const fresh = pool.filter((q) => !used.has(q.id));
    const source = fresh.length >= Math.min(5, free) ? fresh : pool;
    // Rastgele seçimde en fazla bir anket ve bir "kim daha çok?" olsun.
    const kinds = new Set<QuestionKind>(questions.map((q) => q.kind).filter((k) => k !== "text"));
    const picked: BankQuestion[] = [];
    for (const q of [...source].sort(() => Math.random() - 0.5)) {
      if (picked.length >= Math.min(5, free)) break;
      if (q.kind !== "text" && kinds.has(q.kind)) continue;
      if (q.kind !== "text") kinds.add(q.kind);
      picked.push(q);
    }
    setQuestions((list) => [
      ...list,
      ...picked.map((q) => ({
        key: nextKey(),
        text: q.text,
        kind: q.kind,
        options: q.options,
        sourceId: q.id,
        saveToBank: false,
        queueId: null,
        askedBy: null,
      })),
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
    if (!questions.length) return setError(t("En az bir soru seç.", "Choose at least one question."));
    if (questions.some((q) => q.text.trim().length < 3)) {
      return setError(t("Boş ya da çok kısa bir soru var.", "A question is empty or too short."));
    }
    if (start && new Date(deadlineAt).getTime() < Date.now() + 60 * 60 * 1000) {
      return setError(t("Son teslim tarihi en az 1 saat sonra olmalı.", "The deadline must be at least 1 hour from now."));
    }
    if (start && !window.confirm(t("Sayı başlasın mı? Grubundaki herkese e-posta gidecek.", "Start the issue? Everyone in your group will get an email."))) {
      return;
    }

    startTransition(async () => {
      const result = await saveIssue({
        groupId,
        issueId,
        title,
        deadlineAt,
        template,
        start,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          kind: q.kind,
          options: q.options,
          sourceId: q.sourceId,
          saveToBank: q.saveToBank,
          queueId: q.queueId,
          askedBy: q.askedBy,
        })),
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
        <SectionTitle>1. {t("Temel bilgiler", "The basics")}</SectionTitle>
        <Field
          label={t("Başlık (isteğe bağlı)", "Title (optional)")}
          htmlFor="title"
          hint={t(`Boş bırakırsan "Sayı ${nextNumber}" yazar.`, `Leave empty to show "Issue ${nextNumber}".`)}
        >
          <Input
            id="title"
            value={title}
            maxLength={80}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("Sonbahar sayısı", "The autumn issue")}
          />
        </Field>
        <Field
          label={t("Son teslim", "Deadline")}
          htmlFor="deadline"
          hint={
            isClient ? (
              <>
                {t("Gazete", "The newspaper will be published on")} <LocalDateTime iso={deadlineAt} className="font-bold text-ink" />
                {t(" tarihinde yayımlanacak.", ".")}
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
              { label: t("3 gün", "3 days"), days: 3 },
              { label: t("1 hafta", "1 week"), days: 7 },
              { label: t("2 hafta", "2 weeks"), days: 14 },
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
            2. {t("Sorular", "Questions")}{" "}
            <span className="text-base font-bold text-ink-soft">
              ({questions.length}/{MAX_QUESTIONS_PER_ISSUE})
            </span>
          </SectionTitle>
          <Button variant="secondary" size="sm" onClick={addRandom} disabled={full}>
            <Dices className="size-4" aria-hidden="true" /> {t("Rastgele 5 soru", "Random 5")}
          </Button>
        </div>

        {!issueId && queue.length ? (
          <Alert tone="info">
            {t(
              `Editörlerin sıraya eklediği ${Math.min(queue.length, MAX_QUESTIONS_PER_ISSUE)} soru eklendi. İstemediğini çıkarabilirsin; çıkardığın sorular sırada kalır.`,
              queue.length === 1
                ? "1 question from the editors' queue was added. You can remove it; removed questions stay in the queue."
                : `${Math.min(queue.length, MAX_QUESTIONS_PER_ISSUE)} questions from the editors' queue were added. You can remove any; removed ones stay in the queue.`,
            )}
          </Alert>
        ) : null}

        {questions.length ? (
          <ol className="space-y-2.5">
            {questions.map((q, i) => (
              <li key={q.key} className="flex items-start gap-2 rounded-2xl border border-line bg-white p-2.5 pl-3.5">
                <span className="mt-2 font-hand text-2xl leading-none text-terracotta-deep">{i + 1}.</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <Input
                    aria-label={t(`${i + 1}. soru`, `Question ${i + 1}`)}
                    value={q.text}
                    maxLength={300}
                    onChange={(e) => editText(q.key, e.target.value)}
                    className="border-transparent bg-transparent px-2 py-1.5 font-semibold focus:bg-white"
                  />
                  {q.kind !== "text" || q.askedBy ? (
                    <div className="flex flex-wrap items-center gap-2 px-2">
                      <QuestionKindBadge kind={q.kind} />
                      <PollOptionsPreview options={q.options} />
                      {q.askedBy && people[q.askedBy] ? (
                        <span className="text-xs font-bold text-sage-deep">
                          ✍️ {t(`${people[q.askedBy].name} önerdi`, `Suggested by ${people[q.askedBy].name}`)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {q.saveToBank ? (
                    <p className="px-2 text-xs font-bold text-sage-deep">
                      {t("Grubun soru havuzuna da kaydedilecek", "Will also be saved to the group's question pool")}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center">
                  <Button variant="ghost" size="sm" className="px-2" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("Yukarı taşı", "Move up")}>
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    onClick={() => move(i, 1)}
                    disabled={i === questions.length - 1}
                    aria-label={t("Aşağı taşı", "Move down")}
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2 text-[#8e2a20]"
                    onClick={() => setQuestions((list) => list.filter((x) => x.key !== q.key))}
                    aria-label={t("Soruyu çıkar", "Remove question")}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-2xl border-2 border-dashed border-line px-5 py-6 text-center text-ink-soft">
            {t(
              "Aşağıdaki havuzdan soru seç ya da kendi sorunu yaz. 3-5 soru idealdir.",
              "Pick questions from the pool below or write your own. 3–5 questions is ideal.",
            )}
          </p>
        )}

        {waitingQueue.length ? (
          <div className="space-y-2 rounded-2xl bg-sage-soft/60 p-4">
            <p className="text-sm font-bold text-sage-deep">✍️ {t("Editörlerin önerileri", "Suggestions from the editors")}</p>
            <ul className="space-y-2">
              {waitingQueue.map((q) => (
                <li key={q.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5">
                  {q.profiles ? <Avatar name={q.profiles.display_name} src={q.profiles.avatar_url} size="xs" /> : null}
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{q.text}</span> <QuestionKindBadge kind={q.kind} className="ml-1 align-middle" />
                    <PollOptionsPreview options={q.options} className="mt-1" />
                  </span>
                  <Button variant="secondary" size="sm" disabled={full} onClick={() => add(fromQueue(q))}>
                    <Plus className="size-4" aria-hidden="true" /> {t("Ekle", "Add")}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <CustomQuestion disabled={full} onAdd={(q) => add({ ...q, sourceId: null, queueId: null, askedBy: null })} />

        <QuestionPool bank={bank} usedIds={used} selectedIds={selectedIds} disabled={full} onPick={addFromBank} />
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>3. {t("Gazete şablonu", "Newspaper template")}</SectionTitle>
          <Link
            href="/sablonlar"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-terracotta-deep hover:underline"
          >
            {t("Şablonları önizle", "Preview templates")} <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        <TemplatePicker name="template" value={template} onChange={setTemplate} />
        <p className="text-sm text-ink-soft">
          {t(
            "Renkler, yazı tipleri ve editörün notu için sayıyı kaydettikten sonra sayfasındaki",
            "For colours, fonts and the editor's note, save the issue and then use the",
          )}{" "}
          <strong>🎨 {t("Gazete tasarımı", "Newspaper design")}</strong>{" "}
          {t("stüdyosunu kullan.", "studio on its page.")}
        </p>
      </Card>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-3 rounded-[1.75rem] border border-line bg-paper/95 p-3 shadow-lift backdrop-blur">
        <p className="mr-auto hidden px-2 text-sm text-ink-soft sm:block">{t("Başlatınca herkese e-posta gider.", "Starting it emails everyone.")}</p>
        <Button variant="secondary" onClick={() => submit(false)} disabled={pending}>
          <Save className="size-4" aria-hidden="true" /> {t("Taslak olarak kaydet", "Save as draft")}
        </Button>
        <Button onClick={() => submit(true)} disabled={pending}>
          <Rocket className="size-4" aria-hidden="true" /> {pending ? t("Kaydediliyor…", "Saving…") : t("Sayıyı başlat", "Start the issue")}
        </Button>
      </div>
    </div>
  );
}
