"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { deleteFolder } from "@/lib/cloudinary";
import { dbErrorMessage } from "@/lib/errors";
import { MAX_QUESTIONS_PER_ISSUE, TEMPLATE_IDS } from "@/lib/issues";
import { mediaPrefix } from "@/lib/media/limits";
import { runNotifications } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import type { TemplateId } from "@/lib/types";
import { isUuid } from "@/lib/utils";

const saveIssueSchema = z.object({
  groupId: z.uuid(),
  issueId: z.uuid().nullable(),
  title: z.string().trim().max(80, { error: "Başlık en fazla 80 karakter olabilir." }),
  deadlineAt: z.iso.datetime({ offset: true, error: "Geçerli bir son teslim tarihi seç." }),
  template: z.enum(TEMPLATE_IDS as [TemplateId, ...TemplateId[]]),
  questions: z
    .array(
      z.object({
        text: z
          .string()
          .trim()
          .min(3, { error: "Soru çok kısa." })
          .max(300, { error: "Bir soru en fazla 300 karakter olabilir." }),
        sourceId: z.uuid().nullable(),
        saveToBank: z.boolean().optional(),
      }),
    )
    .min(1, { error: "En az bir soru seç." })
    .max(MAX_QUESTIONS_PER_ISSUE, { error: `Bir sayıda en fazla ${MAX_QUESTIONS_PER_ISSUE} soru olabilir.` }),
  start: z.boolean(),
});

export type SaveIssueInput = z.input<typeof saveIssueSchema>;

export async function saveIssue(input: SaveIssueInput): Promise<{ ok: false; error: string } | { ok: true; issueId: string }> {
  const user = await requireUser();
  const parsed = saveIssueSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (data.start && new Date(data.deadlineAt).getTime() < Date.now() + 60 * 60 * 1000) {
    return { ok: false, error: "Son teslim tarihi en az 1 saat sonra olmalı." };
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
  if (error || !issueId) return { ok: false, error: dbErrorMessage(error) };

  if (data.start) after(() => runNotifications({ issueId: issueId as string }));
  revalidatePath(`/gruplar/${data.groupId}`);
  return { ok: true, issueId: issueId as string };
}

export async function startIssue(issueId: string) {
  await requireUser();
  if (!isUuid(issueId)) return { ok: false, error: "Geçersiz istek." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_issue", { p_issue_id: issueId });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  after(() => runNotifications({ issueId }));
  revalidatePath(`/sayi/${issueId}`);
  return { ok: true };
}

export async function publishIssueNow(issueId: string) {
  await requireUser();
  if (!isUuid(issueId)) return { ok: false, error: "Geçersiz istek." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_issue", { p_issue_id: issueId });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  after(() => runNotifications({ issueId }));
  revalidatePath(`/sayi/${issueId}`);
  return { ok: true };
}

export async function updateIssueSettings(
  issueId: string,
  changes: { deadlineAt?: string; template?: TemplateId },
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isUuid(issueId)) return { ok: false, error: "Geçersiz istek." };
  const update: Record<string, string> = {};

  if (changes.deadlineAt !== undefined) {
    const deadline = z.iso.datetime({ offset: true }).safeParse(changes.deadlineAt);
    if (!deadline.success) return { ok: false, error: "Geçerli bir tarih seç." };
    if (new Date(deadline.data).getTime() < Date.now() + 60 * 60 * 1000) {
      return { ok: false, error: "Yeni son teslim tarihi en az 1 saat sonra olmalı." };
    }
    update.deadline_at = deadline.data;
  }
  if (changes.template !== undefined) {
    if (!TEMPLATE_IDS.includes(changes.template)) return { ok: false, error: "Geçersiz şablon." };
    update.template = changes.template;
  }
  if (!Object.keys(update).length) return { ok: true };

  const supabase = await createClient();
  let query = supabase.from("issues").update(update).eq("id", issueId);
  // Süre sadece devam eden bir sayıda uzatılabilir; yayımlanmış sayı geri açılmasın.
  if (update.deadline_at) query = query.in("status", ["draft", "open"]).gt("deadline_at", new Date().toISOString());
  const { data, error } = await query.select("id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Bu sayı artık değiştirilemiyor ya da yetkin yok." };
  revalidatePath(`/sayi/${issueId}`);
  return { ok: true };
}

export async function deleteIssue(issueId: string) {
  await requireUser();
  if (!isUuid(issueId)) return { ok: false, error: "Geçersiz istek." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("issues").delete().eq("id", issueId).select("id, group_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  const deleted = data?.[0];
  if (!deleted) return { ok: false, error: "Bunu sadece grup yöneticileri yapabilir." };
  await deleteFolder(mediaPrefix(deleted.group_id, deleted.id));
  redirect(`/gruplar/${deleted.group_id}`);
}
