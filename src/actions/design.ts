"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseDesign, toGroupDefault } from "@/lib/design";
import { dbErrorMessage } from "@/lib/errors";
import { isTemplateId } from "@/lib/issues";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";

type Result = { ok: true } | { ok: false; error: string };

const NOT_ADMIN = "Bunu sadece grup yöneticileri yapabilir.";

/** Bir sayının gazete tasarımını kaydeder; istenirse grubun varsayılanı da yapar. */
export async function saveIssueDesign(
  issueId: string,
  template: string,
  design: unknown,
  alsoGroupDefault: boolean,
): Promise<Result> {
  await requireUser();
  if (!isUuid(issueId) || !isTemplateId(template)) return { ok: false, error: "Geçersiz istek." };
  const clean = parseDesign(design);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .update({ template, design: clean })
    .eq("id", issueId)
    .select("id, group_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  const issue = data?.[0];
  if (!issue) return { ok: false, error: NOT_ADMIN };

  if (alsoGroupDefault) {
    const { error: groupError } = await supabase
      .from("groups")
      .update({ default_template: template, default_design: toGroupDefault(clean) })
      .eq("id", issue.group_id);
    if (groupError) return { ok: false, error: dbErrorMessage(groupError) };
  }

  revalidatePath(`/sayi/${issueId}`, "layout");
  return { ok: true };
}

/** Grubun varsayılan gazete tasarımı: yeni sayılar bununla başlar. */
export async function saveGroupDesign(groupId: string, template: string, design: unknown): Promise<Result> {
  await requireUser();
  if (!isUuid(groupId) || !isTemplateId(template)) return { ok: false, error: "Geçersiz istek." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({ default_template: template, default_design: toGroupDefault(parseDesign(design)) })
    .eq("id", groupId)
    .select("id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: NOT_ADMIN };

  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true };
}
