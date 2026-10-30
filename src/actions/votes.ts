"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { getT } from "@/lib/i18n-server";
import { effectiveStatus } from "@/lib/issues";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

export type VoteInput = { choice: number } | { userId: string };

/** Anket ya da "kim daha çok?" sorusuna oy verir; süre dolana kadar değiştirilebilir. */
export async function castVote(questionId: string, vote: VoteInput): Promise<Result> {
  const user = await requireUser();
  const t = await getT();
  const invalid = { ok: false as const, error: t("Geçersiz oy.", "Invalid vote.") };
  if (!z.uuid().safeParse(questionId).success) return invalid;
  const choice = "choice" in vote ? vote.choice : null;
  const votedUserId = "userId" in vote ? vote.userId : null;
  if (choice !== null && (!Number.isInteger(choice) || choice < 0 || choice > 5)) return invalid;
  if (votedUserId !== null && !z.uuid().safeParse(votedUserId).success) return invalid;

  const supabase = await createClient();
  const { data: question } = await supabase
    .from("issue_questions")
    .select("id, issues ( status, deadline_at )")
    .eq("id", questionId)
    .maybeSingle();
  const issue = question?.issues as unknown as { status: "draft" | "open" | "published"; deadline_at: string } | null;
  if (!issue) return { ok: false, error: t("Soru bulunamadı.", "Question not found.") };
  if (effectiveStatus(issue) !== "open") {
    return { ok: false, error: t("Bu sayının süresi doldu, artık oy verilemiyor.", "This issue's deadline has passed; voting is closed.") };
  }

  const { error } = await supabase
    .from("votes")
    .upsert(
      { issue_question_id: questionId, user_id: user.id, choice, voted_user_id: votedUserId },
      { onConflict: "issue_question_id,user_id" },
    );
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  return { ok: true };
}

/** Oyu geri alır. */
export async function clearVote(questionId: string): Promise<Result> {
  const user = await requireUser();
  const t = await getT();
  if (!z.uuid().safeParse(questionId).success) return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  const supabase = await createClient();
  const { error } = await supabase.from("votes").delete().eq("issue_question_id", questionId).eq("user_id", user.id);
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  return { ok: true };
}
