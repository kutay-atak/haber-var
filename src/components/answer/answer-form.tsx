"use client";

import { useState } from "react";
import { useT } from "@/components/i18n";
import type { MediaRow, QuestionKind } from "@/lib/types";
import { QuestionCard } from "./question-card";
import { VoteCard, type MyVoteState, type VoteMember } from "./vote-card";

export interface AnswerFormQuestion {
  id: string;
  text: string;
  kind: QuestionKind;
  options: string[] | null;
  body: string;
  media: MediaRow[];
  vote: MyVoteState | null;
}

export function AnswerForm({ questions, members }: { questions: AnswerFormQuestion[]; members: VoteMember[] }) {
  const [filled, setFilled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      questions.map((q) => [q.id, q.kind === "text" ? q.body.trim().length > 0 || q.media.length > 0 : q.vote !== null]),
    ),
  );
  const done = Object.values(filled).filter(Boolean).length;
  const allDone = done === questions.length;
  const t = useT();

  return (
    <div className="space-y-5">
      {questions.map((q, i) => {
        const onContentChange = (id: string, has: boolean) => setFilled((prev) => (prev[id] === has ? prev : { ...prev, [id]: has }));
        return q.kind === "text" ? (
          <QuestionCard
            key={q.id}
            index={i}
            total={questions.length}
            questionId={q.id}
            text={q.text}
            initialBody={q.body}
            initialMedia={q.media}
            onContentChange={onContentChange}
          />
        ) : (
          <VoteCard
            key={q.id}
            index={i}
            total={questions.length}
            questionId={q.id}
            text={q.text}
            kind={q.kind}
            options={q.options ?? []}
            members={members}
            initialVote={q.vote}
            onContentChange={onContentChange}
          />
        );
      })}

      <div
        className={`rounded-[1.75rem] p-6 text-center ${allDone ? "bg-sage-soft text-sage-deep" : "bg-paper/80 text-ink-soft"}`}
        aria-live="polite"
      >
        {allDone ? (
          <>
            <p className="text-4xl" aria-hidden="true">
              🎉
            </p>
            <p className="mt-2 font-display text-2xl font-semibold">{t("Harika! Tüm soruları yanıtladın.", "Great! You've answered every question.")}</p>
            <p className="mt-1 font-semibold">
              {t(
                "Yanıtların kaydedildi. Süre dolana kadar istediğin zaman düzenleyebilirsin.",
                "Your answers are saved. You can edit them any time until the deadline.",
              )}
            </p>
          </>
        ) : (
          <p className="font-semibold">
            {done}/{questions.length} {t("soru yanıtlandı", "questions answered")} ·{" "}
            {t("Yazdıkların ve oyların otomatik olarak kaydedilir.", "Everything you write and vote is saved automatically.")}
          </p>
        )}
      </div>
    </div>
  );
}
