"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { getT } from "@/lib/i18n-server";
import { questionFields, withPollRules } from "@/lib/questions";
import { createClient } from "@/lib/supabase/server";
import type { QuestionKind, QueuedQuestion } from "@/lib/types";
import { isUuid } from "@/lib/utils";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export interface QueueInput {
  text: string;
  kind: QuestionKind;
  options?: string[] | null;
  sourceId?: string | null;
  saveToBank?: boolean;
}

/** Editör ya da yönetici sıradaki sayı için soru önerir. */
export async function addQueuedQuestion(groupId: string, input: QueueInput): Promise<Result<{ item: QueuedQuestion }>> {
  const user = await requireUser();
  const t = await getT();
  if (!isUuid(groupId)) return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  const parsed = withPollRules(
    z.object({ ...questionFields(t), sourceId: z.uuid().nullable().optional(), saveToBank: z.boolean().optional() }),
    t,
  ).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const q = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_queue")
    .insert({
      group_id: groupId,
      text: q.text,
      kind: q.kind,
      options: q.options,
      source_question_id: q.sourceId ?? null,
      added_by: user.id,
    })
    .select("id, text, kind, options, source_question_id, added_by, created_at, profiles ( display_name, avatar_url )")
    .single();
  if (error || !data) {
    if (error?.code === "42501") {
      return { ok: false, error: t("Soru önermek için editör olman gerekiyor.", "You need to be an editor to suggest questions.") };
    }
    return { ok: false, error: dbErrorMessage(error, t) };
  }

  // Kendi yazdığı soruyu grubun havuzuna da ekle (sonraki sayılarda tekrar seçilebilsin).
  if (q.saveToBank && !q.sourceId) {
    await supabase
      .from("question_bank")
      .insert({ group_id: groupId, text: q.text, kind: q.kind, options: q.options, created_by: user.id });
  }

  revalidatePath(`/gruplar/${groupId}`);
  return { ok: true, item: data as unknown as QueuedQuestion };
}

/** Sıradan soru çıkarır: editör kendi önerisini, yönetici her öneriyi. */
export async function removeQueuedQuestion(id: string): Promise<Result> {
  await requireUser();
  const t = await getT();
  if (!isUuid(id)) return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  const supabase = await createClient();
  const { data, error } = await supabase.from("question_queue").delete().eq("id", id).select("group_id");
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  if (!data?.length) {
    return { ok: false, error: t("Bu öneriyi sadece ekleyen kişi ya da bir yönetici çıkarabilir.", "Only the person who added it or an admin can remove it.") };
  }
  revalidatePath(`/gruplar/${data[0].group_id}`);
  return { ok: true };
}
