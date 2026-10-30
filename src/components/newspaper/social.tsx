"use client";

import { MessageCircle, SmilePlus, Trash2 } from "lucide-react";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { addComment, deleteComment, toggleReaction } from "@/actions/social";
import { useLocale, useT } from "@/components/i18n";
import { Avatar } from "@/components/ui/avatar";
import type { SocialComment, SocialData } from "@/lib/data/newspaper";
import { formatDateTime } from "@/lib/format";
import { REACTIONS } from "@/lib/social";
import type { ReactionKey } from "@/lib/types";
import { cn } from "@/lib/utils";

// Yayımlanmış gazetedeki tepki ve yorumlar. Gazete şablonları sunucuda çizilir;
// her yanıtın altındaki <EntrySocial> bu bağlamdan okur. Bağlam yoksa (tasarım
// stüdyosu, örnek gazete) hiçbir şey göstermez.

interface SocialState {
  data: SocialData;
  react: (responseId: string, key: ReactionKey) => void;
  comment: (responseId: string, body: string) => Promise<string | null>;
  remove: (responseId: string, commentId: string) => void;
}

const SocialContext = createContext<SocialState | null>(null);

export function SocialProvider({ initial, children }: { initial: SocialData; children: ReactNode }) {
  const [data, setData] = useState(initial);
  const [, startTransition] = useTransition();

  function setReaction(responseId: string, key: ReactionKey, on: boolean) {
    setData((prev) => {
      const forResponse = { ...prev.reactions[responseId] };
      const people = new Set(forResponse[key] ?? []);
      if (on) people.add(prev.myId);
      else people.delete(prev.myId);
      forResponse[key] = [...people];
      return { ...prev, reactions: { ...prev.reactions, [responseId]: forResponse } };
    });
  }

  const state: SocialState = {
    data,
    react(responseId, key) {
      const mine = data.reactions[responseId]?.[key]?.includes(data.myId) ?? false;
      setReaction(responseId, key, !mine);
      startTransition(async () => {
        const result = await toggleReaction(responseId, key);
        if (!result.ok) setReaction(responseId, key, mine);
        else if (result.active === mine) setReaction(responseId, key, result.active);
      });
    },
    async comment(responseId, body) {
      const result = await addComment(responseId, body);
      if (!result.ok) return result.error;
      setData((prev) => ({
        ...prev,
        comments: { ...prev.comments, [responseId]: [...(prev.comments[responseId] ?? []), result.comment] },
      }));
      return null;
    },
    remove(responseId, commentId) {
      const before = data.comments[responseId] ?? [];
      setData((prev) => ({
        ...prev,
        comments: { ...prev.comments, [responseId]: before.filter((c) => c.id !== commentId) },
      }));
      startTransition(async () => {
        const result = await deleteComment(commentId);
        if (!result.ok) setData((prev) => ({ ...prev, comments: { ...prev.comments, [responseId]: before } }));
      });
    },
  };

  return <SocialContext.Provider value={state}>{children}</SocialContext.Provider>;
}

function Comment({ comment, canDelete, onDelete }: { comment: SocialComment; canDelete: boolean; onDelete: () => void }) {
  const t = useT();
  const locale = useLocale();
  return (
    <li className="flex items-start gap-2.5">
      <Avatar name={comment.author.name} src={comment.author.avatarUrl} size="xs" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.85em] leading-snug">
          <strong>{comment.author.name}</strong>{" "}
          <span className="np-muted text-[0.85em]">{formatDateTime(comment.createdAt, locale)}</span>
        </p>
        <p className="whitespace-pre-line break-words text-[0.92em] leading-snug">{comment.body}</p>
      </div>
      {canDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="np-muted rounded-full p-1 hover:opacity-70"
          aria-label={t("Yorumu sil", "Delete comment")}
          title={t("Yorumu sil", "Delete comment")}
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
}

/** Bir yanıtın altındaki tepki düğmeleri ve yorumlar. Baskıda görünmez. */
export function EntrySocial({ responseId, className }: { responseId: string; className?: string }) {
  const social = useContext(SocialContext);
  const t = useT();
  const locale = useLocale();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  if (!social) return null;

  const { data } = social;
  const reactions = data.reactions[responseId] ?? {};
  const comments = data.comments[responseId] ?? [];
  const given = REACTIONS.filter((r) => (reactions[r.key]?.length ?? 0) > 0);

  async function send() {
    if (!draft.trim() || !social) return;
    setSending(true);
    setError(null);
    const problem = await social.comment(responseId, draft);
    setSending(false);
    if (problem) setError(problem);
    else setDraft("");
  }

  const pill = "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.8rem] font-semibold leading-none transition";

  return (
    <div className={cn("no-print np-social", className)}>
      <div className="flex flex-wrap items-center gap-1.5">
        {given.map((r) => {
          const people = reactions[r.key] ?? [];
          const mine = people.includes(data.myId);
          const names = people.map((id) => (id === data.myId ? t("Sen", "You") : (data.names[id] ?? "?")));
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => social.react(responseId, r.key)}
              aria-pressed={mine}
              title={`${locale === "en" ? r.en : r.tr}: ${names.join(", ")}`}
              className={cn(pill, mine ? "np-social-on" : "np-rule hover:opacity-80")}
            >
              <span aria-hidden="true">{r.emoji}</span>
              <span className="tabular-nums">{people.length}</span>
              <span className="sr-only">{locale === "en" ? r.en : r.tr}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-expanded={pickerOpen}
          className={cn(pill, "np-rule np-muted hover:opacity-80")}
          title={t("Tepki ver", "React")}
        >
          <SmilePlus className="size-4" aria-hidden="true" />
          <span className="sr-only">{t("Tepki ver", "React")}</span>
        </button>
        <button
          type="button"
          onClick={() => setCommentsOpen((v) => !v)}
          aria-expanded={commentsOpen}
          className={cn(pill, "np-rule np-muted hover:opacity-80")}
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {comments.length ? (
            <>
              <span className="tabular-nums">{comments.length}</span>
              <span className="sr-only">{t("yorum", "comments")}</span>
            </>
          ) : (
            <span>{t("Yorum yaz", "Comment")}</span>
          )}
        </button>
      </div>

      {pickerOpen ? (
        <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label={t("Tepki seç", "Pick a reaction")}>
          {REACTIONS.map((r) => {
            const mine = reactions[r.key]?.includes(data.myId) ?? false;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => {
                  social.react(responseId, r.key);
                  setPickerOpen(false);
                }}
                aria-pressed={mine}
                title={locale === "en" ? r.en : r.tr}
                className={cn("rounded-full px-2 py-1 text-xl leading-none transition hover:scale-125", mine && "np-social-on")}
              >
                <span aria-hidden="true">{r.emoji}</span>
                <span className="sr-only">{locale === "en" ? r.en : r.tr}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {commentsOpen ? (
        <div className="mt-3 space-y-3">
          {comments.length ? (
            <ul className="space-y-2.5">
              {comments.map((c) => (
                <Comment
                  key={c.id}
                  comment={c}
                  canDelete={c.userId === data.myId || data.isAdmin}
                  onDelete={() => {
                    if (window.confirm(t("Bu yorum silinsin mi?", "Delete this comment?"))) social.remove(responseId, c.id);
                  }}
                />
              ))}
            </ul>
          ) : null}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              maxLength={500}
              placeholder={t("Bir şey yaz…", "Write something…")}
              aria-label={t("Yorum", "Comment")}
              className="np-rule min-h-9 flex-1 resize-y rounded-xl border bg-transparent px-3 py-2 text-[0.9em] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--np-accent)]"
            />
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !draft.trim()}
              className="np-on-accent rounded-xl px-3 py-2 text-[0.85em] font-bold disabled:opacity-50"
            >
              {sending ? "…" : t("Gönder", "Send")}
            </button>
          </div>
          {error ? (
            <p role="alert" className="text-[0.85em] font-semibold text-[#c0392b]">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
