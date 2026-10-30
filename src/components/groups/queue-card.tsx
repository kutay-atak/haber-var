"use client";

import { ChevronDown, X } from "lucide-react";
import { useState, useTransition } from "react";
import { addQueuedQuestion, removeQueuedQuestion } from "@/actions/queue";
import { useT } from "@/components/i18n";
import { CustomQuestion } from "@/components/questions/custom-question";
import { PollOptionsPreview, QuestionKindBadge } from "@/components/questions/question-kind";
import { QuestionPool } from "@/components/questions/question-pool";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import type { BankQuestion, QueuedQuestion } from "@/lib/types";

/**
 * Ortak editörlük: editörler ve yöneticiler sıradaki sayı için soru önerir.
 * Yönetici yeni sayı hazırlarken (ya da otomatik sayı açılırken) bu sorular önce gelir.
 */
export function QueueCard({
  groupId,
  initialQueue,
  bank,
  myId,
  isAdmin,
}: {
  groupId: string;
  initialQueue: QueuedQuestion[];
  bank: BankQuestion[];
  myId: string;
  isAdmin: boolean;
}) {
  const t = useT();
  const [queue, setQueue] = useState(initialQueue);
  const [poolOpen, setPoolOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const queuedSources = new Set(queue.map((q) => q.source_question_id).filter((id): id is string => !!id));

  function suggest(input: Parameters<typeof addQueuedQuestion>[1]) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await addQueuedQuestion(groupId, input);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setQueue((list) => [...list, result.item]);
      setNotice(t("Soru sıraya eklendi; bir sonraki sayıda sorulacak.", "Added to the queue; it'll be asked in the next issue."));
    });
  }

  function remove(item: QueuedQuestion) {
    setError(null);
    setNotice(null);
    const before = queue;
    setQueue((list) => list.filter((q) => q.id !== item.id));
    startTransition(async () => {
      const result = await removeQueuedQuestion(item.id);
      if (!result.ok) {
        setQueue(before);
        setError(result.error);
      }
    });
  }

  return (
    <section className="space-y-4 rounded-[1.75rem] border border-sage/40 bg-paper p-5 shadow-soft sm:p-6">
      <div>
        <h2 className="text-xl font-semibold">✍️ {t("Sıradaki sayı için sorular", "Questions for the next issue")}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {isAdmin
            ? t(
                "Editörler buraya soru önerir. Yeni sayıyı hazırlarken (ya da otomatik sayı açılırken) bu sorular önce gelir.",
                "Editors suggest questions here. When you prepare the next issue (or an automatic one opens), these come first.",
              )
            : t(
                "Editör olarak sıradaki sayıya soru ekleyebilirsin. Sayı açılınca gazetede adınla birlikte görünür.",
                "As an editor you can add questions to the next issue. They appear in the newspaper with your name.",
              )}
        </p>
      </div>

      {queue.length ? (
        <ol className="space-y-2">
          {queue.map((q, i) => (
            <li key={q.id} className="flex items-start gap-3 rounded-2xl border border-line bg-white px-3 py-2.5">
              <span className="mt-0.5 font-hand text-xl leading-none text-terracotta-deep">{i + 1}.</span>
              <span className="min-w-0 flex-1">
                <span className="font-semibold">{q.text}</span> <QuestionKindBadge kind={q.kind} className="ml-1 align-middle" />
                <PollOptionsPreview options={q.options} className="mt-1" />
                {q.profiles ? (
                  <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                    <Avatar name={q.profiles.display_name} src={q.profiles.avatar_url} size="xs" className="!size-5 !text-[0.55rem]" />
                    {q.added_by === myId ? t("Senin önerin", "Your suggestion") : q.profiles.display_name}
                  </span>
                ) : null}
              </span>
              {isAdmin || q.added_by === myId ? (
                <button
                  type="button"
                  onClick={() => remove(q)}
                  disabled={pending}
                  className="rounded-full p-1.5 text-ink-soft transition hover:bg-[#fbe4e1] hover:text-[#8e2a20]"
                  aria-label={t("Sıradan çıkar", "Remove from the queue")}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-2xl border-2 border-dashed border-line px-4 py-4 text-center text-sm text-ink-soft">
          {t("Sırada henüz soru yok.", "No questions in the queue yet.")}
        </p>
      )}

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <CustomQuestion
        disabled={pending}
        addLabel={t("Sıraya ekle", "Add to queue")}
        onAdd={(q) => suggest({ text: q.text, kind: q.kind, options: q.options, saveToBank: q.saveToBank })}
      />

      <div>
        <button
          type="button"
          onClick={() => setPoolOpen((v) => !v)}
          aria-expanded={poolOpen}
          className="flex items-center gap-1.5 text-sm font-bold text-terracotta-deep hover:underline"
        >
          <ChevronDown className={`size-4 transition ${poolOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          {t("Hazır sorulardan seç", "Pick from ready-made questions")}
        </button>
        {poolOpen ? (
          <div className="mt-3">
            <QuestionPool
              bank={bank}
              selectedIds={queuedSources}
              disabled={pending}
              heading={t("Soru havuzu", "Question pool")}
              onPick={(q) => suggest({ text: q.text, kind: q.kind, options: q.options, sourceId: q.id })}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
