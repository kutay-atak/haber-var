"use client";

import { Check, CircleAlert, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { castVote, clearVote, type VoteInput } from "@/actions/votes";
import { useT } from "@/components/i18n";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface VoteMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface MyVoteState {
  choice: number | null;
  votedUserId: string | null;
}

/** Anket ya da "kim daha çok?" sorusu: tek dokunuşla oy, süre dolana kadar değiştirilebilir. */
export function VoteCard({
  index,
  total,
  questionId,
  text,
  kind,
  options,
  members,
  initialVote,
  onContentChange,
}: {
  index: number;
  total: number;
  questionId: string;
  text: string;
  kind: "poll" | "who";
  options: string[];
  members: VoteMember[];
  initialVote: MyVoteState | null;
  onContentChange: (questionId: string, hasContent: boolean) => void;
}) {
  const t = useT();
  const [vote, setVote] = useState<MyVoteState | null>(initialVote);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function choose(next: MyVoteState, input: VoteInput) {
    const before = vote;
    setVote(next);
    setStatus("idle");
    setError(null);
    onContentChange(questionId, true);
    startTransition(async () => {
      const result = await castVote(questionId, input);
      if (result.ok) {
        setStatus("saved");
        return;
      }
      setVote(before);
      onContentChange(questionId, !!before);
      setStatus("error");
      setError(result.error);
    });
  }

  function undo() {
    const before = vote;
    setVote(null);
    setStatus("idle");
    onContentChange(questionId, false);
    startTransition(async () => {
      const result = await clearVote(questionId);
      if (!result.ok) {
        setVote(before);
        onContentChange(questionId, !!before);
        setStatus("error");
        setError(result.error);
      }
    });
  }

  const choiceClass = (selected: boolean) =>
    cn(
      "relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition",
      selected
        ? "border-terracotta-deep bg-terracotta-soft/70 shadow-soft"
        : "border-line bg-white hover:border-terracotta/50 hover:shadow-soft",
    );

  return (
    <article className="animate-pop rounded-[1.75rem] border border-line/80 bg-paper p-5 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-extrabold uppercase tracking-widest text-terracotta-deep">
          {t("Soru", "Question")} {index + 1}/{total}
        </p>
        <span className="rounded-full bg-mustard-soft px-2.5 py-0.5 text-xs font-bold text-mustard-ink">
          {kind === "poll" ? `📊 ${t("Anket", "Poll")}` : `🏆 ${t("Kim daha çok?", "Most likely to…")}`}
        </span>
      </div>
      <h2 className="mt-1.5 text-2xl font-semibold leading-snug" id={`vote-${questionId}`}>
        {text}
      </h2>

      <div
        role="radiogroup"
        aria-labelledby={`vote-${questionId}`}
        className={cn("mt-4 grid gap-2.5", kind === "poll" ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3")}
      >
        {kind === "poll"
          ? options.map((label, i) => {
              const selected = vote?.choice === i;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={pending}
                  onClick={() => choose({ choice: i, votedUserId: null }, { choice: i })}
                  className={choiceClass(selected)}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                      selected ? "border-terracotta-deep bg-terracotta-deep text-white" : "border-line",
                    )}
                    aria-hidden="true"
                  >
                    {selected ? <Check className="size-3.5" /> : null}
                  </span>
                  <span className="min-w-0 break-words">{label}</span>
                </button>
              );
            })
          : members.map((m) => {
              const selected = vote?.votedUserId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={pending}
                  onClick={() => choose({ choice: null, votedUserId: m.id }, { userId: m.id })}
                  className={cn(choiceClass(selected), "flex-col justify-center py-4 text-center")}
                >
                  {selected ? (
                    <span className="absolute right-2 top-1.5 text-lg" aria-hidden="true">
                      👑
                    </span>
                  ) : null}
                  <Avatar name={m.name} src={m.avatarUrl} size="md" />
                  <span className="max-w-full truncate text-sm">{m.name}</span>
                </button>
              );
            })}
      </div>

      <div className="mt-3 flex min-h-6 flex-wrap items-center justify-between gap-2 text-sm font-semibold">
        <span aria-live="polite" className="flex items-center gap-1.5 text-ink-soft">
          {pending ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> {t("Kaydediliyor…", "Saving…")}
            </>
          ) : status === "saved" && vote ? (
            <span className="flex items-center gap-1.5 text-sage-deep">
              <Check className="size-4" aria-hidden="true" /> {t("Oyun kaydedildi", "Vote saved")}
            </span>
          ) : status === "error" ? (
            <span className="flex items-center gap-1.5 text-[#8e2a20]">
              <CircleAlert className="size-4" aria-hidden="true" /> {error}
            </span>
          ) : null}
        </span>
        {vote && !pending ? (
          <button type="button" onClick={undo} className="text-ink-soft underline hover:text-ink">
            {t("Oyumu geri al", "Take back my vote")}
          </button>
        ) : null}
      </div>

      <p className="mt-3 rounded-2xl bg-sand/60 px-4 py-2.5 text-sm text-ink-soft">
        {kind === "who"
          ? t(
              "🤫 Oyun gizli kalır. Gazete çıkınca sadece kimin kaç oy aldığı görünür.",
              "🤫 Your vote stays secret. When the newspaper comes out, only the totals are shown.",
            )
          : t(
              "📊 Sonuçlar gazete çıkınca açıklanır. Ankette kimin neyi seçtiği gazetede görünür.",
              "📊 Results are revealed when the newspaper comes out. Poll choices are shown with names.",
            )}
      </p>
    </article>
  );
}
