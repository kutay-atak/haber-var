"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { deleteFolder } from "@/lib/cloudinary";
import { dbErrorMessage } from "@/lib/errors";
import { isTemplateId } from "@/lib/issues";
import { mediaPrefix } from "@/lib/media/limits";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";

const groupFields = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Grubuna bir isim ver." })
    .max(60, { error: "Grup adı en fazla 60 karakter olabilir." }),
  description: z.string().trim().max(280, { error: "Açıklama en fazla 280 karakter olabilir." }).optional(),
});

export async function createGroup(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = groupFields.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", {
    p_name: parsed.data.name,
    p_description: parsed.data.description ?? null,
  });
  if (error || !data) return { error: dbErrorMessage(error) };
  redirect(`/gruplar/${data}?yeni=1`);
}

export async function updateGroup(groupId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = groupFields.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const template = formData.get("default_template");
  if (!isUuid(groupId) || !isTemplateId(template)) return { error: "Geçersiz istek." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      default_template: template,
    })
    .eq("id", groupId)
    .select("id");
  if (error) return { error: dbErrorMessage(error) };
  if (!data?.length) return { error: "Bunu sadece grup yöneticileri yapabilir." };
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { success: "Kaydedildi." };
}

export async function regenerateInvite(groupId: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  await requireUser();
  if (!isUuid(groupId)) return { ok: false, error: "Geçersiz istek." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerate_invite", { p_group_id: groupId });
  if (error || !data) return { ok: false, error: dbErrorMessage(error) };
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true, token: data as string };
}

export async function acceptInvite(token: string) {
  await requireUser(`/davet/${encodeURIComponent(token)}`);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error || !data) redirect(`/davet/${encodeURIComponent(token)}?hata=${encodeURIComponent(dbErrorMessage(error))}`);
  redirect(`/gruplar/${data}?katildin=1`);
}

/** Bu kişi gruptaki son yönetici mi? (Grup yöneticisiz kalmasın.) */
async function isLastAdmin(groupId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("group_members").select("user_id, role").eq("group_id", groupId);
  const admins = (data ?? []).filter((m) => m.role === "admin");
  return { lastAdmin: admins.length === 1 && admins[0].user_id === userId, memberCount: data?.length ?? 0 };
}

export async function setMemberRole(groupId: string, userId: string, role: "admin" | "member") {
  await requireUser();
  if (!isUuid(groupId) || !isUuid(userId) || (role !== "admin" && role !== "member")) {
    return { ok: false, error: "Geçersiz istek." };
  }
  if (role === "member" && (await isLastAdmin(groupId, userId)).lastAdmin) {
    return { ok: false, error: "Grupta en az bir yönetici kalmalı." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Bunu sadece grup yöneticileri yapabilir." };
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true };
}

export async function removeMember(groupId: string, userId: string) {
  const me = await requireUser();
  if (!isUuid(groupId) || !isUuid(userId)) return { ok: false, error: "Geçersiz istek." };
  if (userId === me.id) return { ok: false, error: "Kendini çıkarmak için \"Gruptan ayrıl\" seçeneğini kullan." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { ok: false, error: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, error: "Bunu sadece grup yöneticileri yapabilir." };
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true };
}

export async function leaveGroup(groupId: string): Promise<FormState> {
  const me = await requireUser();
  if (!isUuid(groupId)) return { error: "Geçersiz istek." };
  const { lastAdmin, memberCount } = await isLastAdmin(groupId, me.id);
  if (lastAdmin && memberCount > 1) {
    return { error: "Ayrılmadan önce başka birini yönetici yap." };
  }
  if (memberCount <= 1) {
    return { error: "Gruptaki son kişisin. Ayrılmak yerine grubu ayarlardan silebilirsin." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", me.id);
  if (error) return { error: dbErrorMessage(error) };
  redirect("/gruplar");
}

export async function deleteGroup(groupId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  if (!isUuid(groupId)) return { error: "Geçersiz istek." };
  const supabase = await createClient();
  const { data: group } = await supabase.from("groups").select("name").eq("id", groupId).maybeSingle();
  if (!group) return { error: "Grup bulunamadı." };
  if (String(formData.get("confirm") ?? "").trim() !== group.name) {
    return { error: "Onaylamak için grubun adını aynen yaz." };
  }

  const { data, error } = await supabase.from("groups").delete().eq("id", groupId).select("id");
  if (error) return { error: dbErrorMessage(error) };
  if (!data?.length) return { error: "Bunu sadece grup yöneticileri yapabilir." };

  // Cloudinary'deki fotoğraf ve videoları da temizle ki kota boşa harcanmasın.
  await deleteFolder(mediaPrefix(groupId));
  redirect("/gruplar");
}
