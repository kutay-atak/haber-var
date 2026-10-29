import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BankQuestion, Issue, IssueQuestion, MediaRow, MemberRole } from "@/lib/types";

export interface IssueWithGroup extends Issue {
  group: { id: string; name: string; default_template: Issue["template"] };
  myRole: MemberRole;
}

/** Sayı ve grubu. Sayıyı görme yetkin yoksa (RLS) null döner. */
export async function getIssue(issueId: string, userId: string): Promise<IssueWithGroup | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .select(
      "id, group_id, number, title, status, template, deadline_at, opened_at, published_at, created_at, groups ( id, name, default_template )",
    )
    .eq("id", issueId)
    .maybeSingle();
  if (error) {
    // Geçersiz UUID gibi durumlarda da sayfa "bulunamadı" göstersin.
    if (error.code === "22P02") return null;
    throw error;
  }
  if (!data) return null;

  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", data.group_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) return null;

  const { groups, ...issue } = data;
  return { ...(issue as Issue), group: groups as unknown as IssueWithGroup["group"], myRole: membership.role };
}

export async function getIssueQuestions(issueId: string): Promise<IssueQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issue_questions")
    .select("id, issue_id, position, question_text, source_question_id")
    .eq("issue_id", issueId)
    .order("position");
  if (error) throw error;
  return (data ?? []) as IssueQuestion[];
}

export interface MyAnswer {
  responseId: string;
  questionId: string;
  body: string;
  media: MediaRow[];
}

export async function getMyAnswers(issueId: string, userId: string): Promise<MyAnswer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("responses")
    .select("id, issue_question_id, body, response_media ( id, response_id, kind, public_id, width, height, duration_s, bytes, position )")
    .eq("issue_id", issueId)
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    responseId: r.id,
    questionId: r.issue_question_id,
    body: r.body,
    media: ((r.response_media ?? []) as MediaRow[]).sort((a, b) => a.position - b.position),
  }));
}

/** Bu sayıya en az bir yanıt yazmış üyelerin kimlikleri (içerik değil). */
export async function getParticipantIds(issueId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("issue_participants", { p_issue_id: issueId });
  return ((data ?? []) as string[]).filter(Boolean);
}

/** Hazır sorular + grubun kendi kaydettiği sorular. */
export async function getQuestionBank(groupId: string): Promise<BankQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_bank")
    .select("id, text, category, group_id")
    .or(`group_id.is.null,group_id.eq.${groupId}`)
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as BankQuestion[];
}

/** Bu grupta daha önce sorulmuş havuz sorularının kimlikleri. */
export async function getUsedQuestionIds(groupId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("issue_questions")
    .select("source_question_id, issues!inner ( group_id )")
    .eq("issues.group_id", groupId)
    .not("source_question_id", "is", null);
  return [...new Set((data ?? []).map((row) => row.source_question_id as string))];
}
