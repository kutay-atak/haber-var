"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import type { SocialComment } from "@/lib/data/newspaper";
import { dbErrorMessage } from "@/lib/errors";
import { getT } from "@/lib/i18n-server";
import { REACTION_KEYS } from "@/lib/social";
import { createClient } from "@/lib/supabase/server";
import type { PersonSummary, ReactionKey } from "@/lib/types";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Bir yanıta tepki verir ya da verdiği tepkiyi geri alır. */
export async function toggleReaction(responseId: string, emoji: ReactionKey): Promise<Result<{ active: boolean }>> {
  const user = await requireUser();
  const t = await getT();
  if (!z.uuid().safeParse(responseId).success || !REACTION_KEYS.includes(emoji)) {
    return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  }
  const supabase = await createClient();
  const { data: removed, error: deleteError } = await supabase
    .from("reactions")
    .delete()
    .eq("response_id", responseId)
    .eq("user_id", user.id)
    .eq("emoji", emoji)
    .select("emoji");
  if (deleteError) return { ok: false, error: dbErrorMessage(deleteError, t) };
  if (removed?.length) return { ok: true, active: false };

  const { error } = await supabase.from("reactions").insert({ response_id: responseId, user_id: user.id, emoji });
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  return { ok: true, active: true };
}

/** Yayımlanmış gazetedeki bir yanıta yorum yazar. */
export async function addComment(responseId: string, body: string): Promise<Result<{ comment: SocialComment }>> {
  const user = await requireUser();
  const t = await getT();
  const text = String(body ?? "").trim();
  if (!z.uuid().safeParse(responseId).success) return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  if (!text) return { ok: false, error: t("Yorum boş olamaz.", "The comment can't be empty.") };
  if (text.length > 500) return { ok: false, error: t("Yorum en fazla 500 karakter olabilir.", "A comment can be at most 500 characters.") };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({ response_id: responseId, user_id: user.id, body: text })
    .select("id, user_id, body, created_at, profiles ( display_name, avatar_url )")
    .single();
  if (error || !data) return { ok: false, error: dbErrorMessage(error, t) };
  const profile = data.profiles as unknown as PersonSummary | null;
  return {
    ok: true,
    comment: {
      id: data.id,
      userId: data.user_id,
      author: { id: data.user_id, name: profile?.display_name ?? t("Sen", "You"), avatarUrl: profile?.avatar_url ?? null },
      body: data.body,
      createdAt: data.created_at,
    },
  };
}

/** Kendi yorumunu (yönetici her yorumu) siler. */
export async function deleteComment(commentId: string): Promise<Result> {
  await requireUser();
  const t = await getT();
  if (!z.uuid().safeParse(commentId).success) return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  const supabase = await createClient();
  const { data, error } = await supabase.from("comments").delete().eq("id", commentId).select("id");
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  if (!data?.length) return { ok: false, error: t("Bu yorumu silemezsin.", "You can't delete this comment.") };
  return { ok: true };
}
