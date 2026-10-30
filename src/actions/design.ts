"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { parseDesign, toGroupDefault } from "@/lib/design";
import { dbErrorMessage } from "@/lib/errors";
import type { T } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { isTemplateId } from "@/lib/issues";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";

type Result = { ok: true } | { ok: false; error: string };

const notAdmin = (t: T) => t("Bunu sadece grup yöneticileri yapabilir.", "Only group admins can do this.");
const invalid = (t: T) => t("Geçersiz istek.", "Invalid request.");

/** Bir sayının gazete tasarımını kaydeder; istenirse grubun varsayılanı da yapar. */
export async function saveIssueDesign(
  issueId: string,
  template: string,
  design: unknown,
  alsoGroupDefault: boolean,
): Promise<Result> {
  await requireUser();
  const t = await getT();
  if (!isUuid(issueId) || !isTemplateId(template)) return { ok: false, error: invalid(t) };
  const clean = parseDesign(design);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("issues")
    .update({ template, design: clean })
    .eq("id", issueId)
    .select("id, group_id");
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  const issue = data?.[0];
  if (!issue) return { ok: false, error: notAdmin(t) };

  if (alsoGroupDefault) {
    const { error: groupError } = await supabase
      .from("groups")
      .update({ default_template: template, default_design: toGroupDefault(clean) })
      .eq("id", issue.group_id);
    if (groupError) return { ok: false, error: dbErrorMessage(groupError, t) };
  }

  revalidatePath(`/sayi/${issueId}`, "layout");
  return { ok: true };
}

/** Grubun varsayılan gazete tasarımı: yeni sayılar bununla başlar. */
export async function saveGroupDesign(groupId: string, template: string, design: unknown): Promise<Result> {
  await requireUser();
  const t = await getT();
  if (!isUuid(groupId) || !isTemplateId(template)) return { ok: false, error: invalid(t) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({ default_template: template, default_design: toGroupDefault(parseDesign(design)) })
    .eq("id", groupId)
    .select("id");
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  if (!data?.length) return { ok: false, error: notAdmin(t) };

  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true };
}
