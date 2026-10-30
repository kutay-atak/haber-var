"use client";

import { useState } from "react";
import { QuestionCard } from "./question-card";
import type { MediaRow } from "@/lib/types";
import { useT } from "@/components/i18n";

export interface AnswerFormQuestion {
  id: string;
  text: string;
  body: string;
  media: MediaRow[];
}

export function AnswerForm({ questions }: { questions: AnswerFormQuestion[] }) {
  const [filled, setFilled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, q.body.trim().length > 0 || q.media.length > 0])),
  );
  const done = Object.values(filled).filter(Boolean).length;
  const allDone = done === questions.length;
  const t = useT();

  return (
    <div className="space-y-5">
      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          index={i}
          total={questions.length}
          questionId={q.id}
          text={q.text}
          initialBody={q.body}
          initialMedia={q.media}
          onContentChange={(id, has) => setFilled((prev) => (prev[id] === has ? prev : { ...prev, [id]: has }))}
        />
      ))}

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
            {t("Yazdıkların otomatik olarak kaydedilir.", "Everything you write is saved automatically.")}
          </p>
        )}
      </div>
    </div>
  );
}
