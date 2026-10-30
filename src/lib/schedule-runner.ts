import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { translateBankQuestion } from "@/lib/question-bank-en";
import { nextRunAfterRun, scheduledDeadline } from "@/lib/schedules";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IssueSchedule, QuestionKind } from "@/lib/types";

interface PoolQuestion {
  id: string;
  text: string;
  kind: QuestionKind;
  options: string[] | null;
  group_id: string | null;
}

interface PickedQuestion {
  text: string;
  kind: QuestionKind;
  options: string[] | null;
  source_id: string | null;
  queue_id?: string;
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Önce editörlerin sıraya eklediği sorular, kalan yerler havuzdan rastgele dolar:
 * bu grupta daha önce sorulmamış sorular öncelikli, en fazla bir anket ve bir "kim daha çok?".
 */
async function pickQuestions(admin: SupabaseClient, schedule: IssueSchedule): Promise<PickedQuestion[]> {
  const [queueRes, bankRes, usedRes] = await Promise.all([
    admin
      .from("question_queue")
      .select("id, text, kind, options, source_question_id")
      .eq("group_id", schedule.group_id)
      .order("created_at")
      .limit(schedule.question_count),
    admin
      .from("question_bank")
      .select("id, text, kind, options, group_id")
      .or(`group_id.is.null,group_id.eq.${schedule.group_id}`),
    admin
      .from("issue_questions")
      .select("source_question_id, issues!inner ( group_id )")
      .eq("issues.group_id", schedule.group_id)
      .not("source_question_id", "is", null),
  ]);

  const picked: PickedQuestion[] = (queueRes.data ?? []).map((q) => ({
    text: q.text,
    kind: q.kind,
    options: q.options,
    source_id: q.source_question_id,
    queue_id: q.id,
  }));
  const taken = new Set(picked.map((q) => q.source_id).filter(Boolean));
  const used = new Set((usedRes.data ?? []).map((r) => r.source_question_id as string));
  const pool = ((bankRes.data ?? []) as PoolQuestion[]).filter((q) => !taken.has(q.id));
  const ordered = [...shuffle(pool.filter((q) => !used.has(q.id))), ...shuffle(pool.filter((q) => used.has(q.id)))];

  const kinds = new Set(picked.map((q) => q.kind));
  for (const q of ordered) {
    if (picked.length >= schedule.question_count) break;
    if (q.kind !== "text" && kinds.has(q.kind)) continue;
    kinds.add(q.kind);
    const shown = schedule.locale === "en" && !q.group_id ? translateBankQuestion(q) : q;
    picked.push({ text: shown.text, kind: q.kind, options: shown.options, source_id: q.id });
  }
  return picked;
}

export interface ScheduleSummary {
  due: number;
  started: number;
  waiting: number;
  failed: number;
}

/** Zamanı gelen otomatik sayıları açar. Devam eden bir sayı varsa ertesi gün tekrar dener. */
export async function runSchedules(now: Date = new Date()): Promise<ScheduleSummary> {
  const admin = createAdminClient();
  const summary: ScheduleSummary = { due: 0, started: 0, waiting: 0, failed: 0 };
  const { data, error } = await admin
    .from("issue_schedules")
    .select("group_id, enabled, frequency, weekday, month_day, duration_days, question_count, locale, next_run_at, last_run_at")
    .eq("enabled", true)
    .lte("next_run_at", now.toISOString());
  if (error) throw error;

  for (const schedule of (data ?? []) as IssueSchedule[]) {
    summary.due += 1;
    try {
      const questions = await pickQuestions(admin, schedule);
      if (!questions.length) {
        summary.failed += 1;
        continue;
      }
      const { data: issueId, error: createError } = await admin.rpc("create_scheduled_issue", {
        p_group_id: schedule.group_id,
        p_deadline_at: scheduledDeadline(now, schedule.duration_days).toISOString(),
        p_questions: questions,
      });
      if (createError) throw createError;
      if (!issueId) {
        summary.waiting += 1;
        continue;
      }
      summary.started += 1;
      await admin
        .from("issue_schedules")
        .update({ last_run_at: now.toISOString(), next_run_at: nextRunAfterRun(schedule, now).toISOString() })
        .eq("group_id", schedule.group_id);
    } catch (err) {
      summary.failed += 1;
      console.error("[otomatik sayı]", schedule.group_id, err);
    }
  }
  return summary;
}
