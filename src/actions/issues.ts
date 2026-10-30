"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { deleteFolder } from "@/lib/cloudinary";
import { dbErrorMessage } from "@/lib/errors";
import type { T } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { MAX_QUESTIONS_PER_ISSUE, TEMPLATE_IDS } from "@/lib/issues";
import { mediaPrefix } from "@/lib/media/limits";
import { runNotifications } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import type { TemplateId } from "@/lib/types";
import { isUuid } from "@/lib/utils";

const saveIssueSchema = (t: T) =>
  z.object({
    groupId: z.uuid(),
    issueId: z.uuid().nullable(),
    title: z.string().trim().max(80, { error: t("Başlık en fazla 80 karakter olabilir.", "The title can be at most 80 characters.") }),
    deadlineAt: z.iso.datetime({ offset: true, error: t("Geçerli bir son teslim tarihi seç.", "Choose a valid deadline.") }),
    template: z.enum(TEMPLATE_IDS as [TemplateId, ...TemplateId[]]),
    questions: z
      .array(
        z.object({
          text: z
            .string()
            .trim()
            .min(3, { error: t("Soru çok kısa.", "The question is too short.") })
            .max(300, { error: t("Bir soru en fazla 300 karakter olabilir.", "A question can be at most 300 characters.") }),
          sourceId: z.uuid().nullable(),
          saveToBank: z.boolean().optional(),
        }),
      )
      .min(1, { error: t("En az bir soru seç.", "Choose at least one question.") })
      .max(MAX_QUESTIONS_PER_ISSUE, {
        error: t(
          `Bir sayıda en fazla ${MAX_QUESTIONS_PER_ISSUE} soru olabilir.`,
          `An issue can have at most ${MAX_QUESTIONS_PER_ISSUE} questions.`,
        ),
      }),
    start: z.boolean(),
  });

const invalid = (t: T) => t("Geçersiz istek.", "Invalid request.");

export type SaveIssueInput = z.input<ReturnType<typeof saveIssueSchema>>;

export async function saveIssue(input: SaveIssueInput): Promise<{ ok: false; error: string } | { ok: true; issueId: string }> {
  const user = await requireUser();
  const t = await getT();
  const parsed = saveIssueSchema(t).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (data.start && new Date(data.deadlineAt).getTime() < Date.now() + 60 * 60 * 1000) {
    return { ok: false, error: t("Son teslim tarihi en az 1 saat sonra olmalı.", "The deadline must be at least 1 hour from now.") };
  }

  const supabase = await createClient();

  // "Havuza kaydet" işaretli kendi sorularını grubun soru havuzuna ekle.
  const toBank = data.questions.filter((q) => q.saveToBank && !q.sourceId);
  if (toBank.length) {
    const { data: saved } = await supabase
      .from("question_bank")
      .insert(toBank.map((q) => ({ text: q.text, group_id: data.groupId, created_by: user.id })))
      .select("id, text");
    for (const row of saved ?? []) {
      const q = data.questions.find((item) => item.text === row.text && !item.sourceId);
      if (q) q.sourceId = row.id;
    }
  }

  const { data: issueId, error } = await supabase.rpc("save_issue", {
    p_group_id: data.groupId,
    p_issue_id: data.issueId,
    p_title: data.title,
    p_deadline_at: data.deadlineAt,
    p_template: data.template,
    p_questions: data.questions.map((q) => ({ text: q.text, source_id: q.sourceId })),
    p_start: data.start,
  });
  if (error || !issueId) return { ok: false, error: dbErrorMessage(error, t) };

  if (data.start) after(() => runNotifications({ issueId: issueId as string }));
  revalidatePath(`/gruplar/${data.groupId}`);
  return { ok: true, issueId: issueId as string };
}

export async function startIssue(issueId: string) {
  await requireUser();
  const t = await getT();
  if (!isUuid(issueId)) return { ok: false, error: invalid(t) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_issue", { p_issue_id: issueId });
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  after(() => runNotifications({ issueId }));
  revalidatePath(`/sayi/${issueId}`);
  return { ok: true };
}

export async function publishIssueNow(issueId: string) {
  await requireUser();
  const t = await getT();
  if (!isUuid(issueId)) return { ok: false, error: invalid(t) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_issue", { p_issue_id: issueId });
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  after(() => runNotifications({ issueId }));
  revalidatePath(`/sayi/${issueId}`);
  return { ok: true };
}

export async function updateIssueSettings(
  issueId: string,
  changes: { deadlineAt: string },
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  const t = await getT();
  if (!isUuid(issueId)) return { ok: false, error: invalid(t) };
  const deadline = z.iso.datetime({ offset: true }).safeParse(changes.deadlineAt);
  if (!deadline.success) return { ok: false, error: t("Geçerli bir tarih seç.", "Choose a valid date.") };
  if (new Date(deadline.data).getTime() < Date.now() + 60 * 60 * 1000) {
    return { ok: false, error: t("Yeni son teslim tarihi en az 1 saat sonra olmalı.", "The new deadline must be at least 1 hour from now.") };
  }

  const supabase = await createClient();
  // Süre sadece devam eden bir sayıda değiştirilebilir; yayımlanmış sayı geri açılmasın.
  const { data, error } = await supabase
    .from("issues")
    .update({ deadline_at: deadline.data })
    .eq("id", issueId)
    .in("status", ["draft", "open"])
    .gt("deadline_at", new Date().toISOString())
    .select("id");
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  if (!data?.length) return { ok: false, error: t("Bu sayı artık değiştirilemiyor ya da yetkin yok.", "This issue can't be changed anymore, or you don't have permission.") };
  revalidatePath(`/sayi/${issueId}`);
  return { ok: true };
}

export async function deleteIssue(issueId: string) {
  await requireUser();
  const t = await getT();
  if (!isUuid(issueId)) return { ok: false, error: invalid(t) };
  const supabase = await createClient();
  const { data, error } = await supabase.from("issues").delete().eq("id", issueId).select("id, group_id");
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  const deleted = data?.[0];
  if (!deleted) return { ok: false, error: t("Bunu sadece grup yöneticileri yapabilir.", "Only group admins can do this.") };
  await deleteFolder(mediaPrefix(deleted.group_id, deleted.id));
  redirect(`/gruplar/${deleted.group_id}`);
}
