"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { deleteFolder } from "@/lib/cloudinary";
import { dbErrorMessage } from "@/lib/errors";
import type { T } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { mediaPrefix } from "@/lib/media/limits";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils";
import type { MemberRole } from "@/lib/types";

const groupFields = (t: T) =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { error: t("Grubuna bir isim ver.", "Give your group a name.") })
      .max(60, { error: t("Grup adı en fazla 60 karakter olabilir.", "The group name can be at most 60 characters.") }),
    description: z
      .string()
      .trim()
      .max(280, { error: t("Açıklama en fazla 280 karakter olabilir.", "The description can be at most 280 characters.") })
      .optional(),
  });

const invalid = (t: T) => t("Geçersiz istek.", "Invalid request.");
const notAdmin = (t: T) => t("Bunu sadece grup yöneticileri yapabilir.", "Only group admins can do this.");

export async function createGroup(_prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  await requireUser();
  const parsed = groupFields(t).safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", {
    p_name: parsed.data.name,
    p_description: parsed.data.description ?? null,
  });
  if (error || !data) return { error: dbErrorMessage(error, t) };
  redirect(`/gruplar/${data}?yeni=1`);
}

export async function updateGroup(groupId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  await requireUser();
  const parsed = groupFields(t).safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (!isUuid(groupId)) return { error: invalid(t) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({ name: parsed.data.name, description: parsed.data.description || null })
    .eq("id", groupId)
    .select("id");
  if (error) return { error: dbErrorMessage(error, t) };
  if (!data?.length) return { error: notAdmin(t) };
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { success: t("Kaydedildi.", "Saved.") };
}

export async function regenerateInvite(groupId: string): Promise<{ ok: boolean; token?: string; error?: string }> {
  const t = await getT();
  await requireUser();
  if (!isUuid(groupId)) return { ok: false, error: invalid(t) };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerate_invite", { p_group_id: groupId });
  if (error || !data) return { ok: false, error: dbErrorMessage(error, t) };
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true, token: data as string };
}

export async function acceptInvite(token: string) {
  const t = await getT();
  await requireUser(`/davet/${encodeURIComponent(token)}`);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error || !data) redirect(`/davet/${encodeURIComponent(token)}?hata=${encodeURIComponent(dbErrorMessage(error, t))}`);
  redirect(`/gruplar/${data}?katildin=1`);
}

/** Bu kişi gruptaki son yönetici mi? (Grup yöneticisiz kalmasın.) */
async function isLastAdmin(groupId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("group_members").select("user_id, role").eq("group_id", groupId);
  const admins = (data ?? []).filter((m) => m.role === "admin");
  return { lastAdmin: admins.length === 1 && admins[0].user_id === userId, memberCount: data?.length ?? 0 };
}

export async function setMemberRole(groupId: string, userId: string, role: MemberRole) {
  const t = await getT();
  await requireUser();
  if (!isUuid(groupId) || !isUuid(userId) || !["admin", "editor", "member"].includes(role)) {
    return { ok: false, error: invalid(t) };
  }
  if (role !== "admin" && (await isLastAdmin(groupId, userId)).lastAdmin) {
    return { ok: false, error: t("Grupta en az bir yönetici kalmalı.", "A group needs at least one admin.") };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .update({ role })
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  if (!data?.length) return { ok: false, error: notAdmin(t) };
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true };
}

export async function removeMember(groupId: string, userId: string) {
  const t = await getT();
  const me = await requireUser();
  if (!isUuid(groupId) || !isUuid(userId)) return { ok: false, error: invalid(t) };
  if (userId === me.id) return { ok: false, error: t("Kendini çıkarmak için \"Gruptan ayrıl\" seçeneğini kullan.", "To remove yourself, use \"Leave group\".") };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .select("user_id");
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  if (!data?.length) return { ok: false, error: notAdmin(t) };
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true };
}

export async function leaveGroup(groupId: string): Promise<FormState> {
  const t = await getT();
  const me = await requireUser();
  if (!isUuid(groupId)) return { error: invalid(t) };
  const { lastAdmin, memberCount } = await isLastAdmin(groupId, me.id);
  if (lastAdmin && memberCount > 1) {
    return { error: t("Ayrılmadan önce başka birini yönetici yap.", "Make someone else an admin before you leave.") };
  }
  if (memberCount <= 1) {
    return {
      error: t(
        "Gruptaki son kişisin. Ayrılmak yerine grubu ayarlardan silebilirsin.",
        "You're the last person in the group. Instead of leaving, you can delete the group in its settings.",
      ),
    };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", me.id);
  if (error) return { error: dbErrorMessage(error, t) };
  redirect("/gruplar");
}

export async function deleteGroup(groupId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const t = await getT();
  await requireUser();
  if (!isUuid(groupId)) return { error: invalid(t) };
  const supabase = await createClient();
  const { data: group } = await supabase.from("groups").select("name").eq("id", groupId).maybeSingle();
  if (!group) return { error: t("Grup bulunamadı.", "Group not found.") };
  if (String(formData.get("confirm") ?? "").trim() !== group.name) {
    return { error: t("Onaylamak için grubun adını aynen yaz.", "Type the group name exactly to confirm.") };
  }

  const { data, error } = await supabase.from("groups").delete().eq("id", groupId).select("id");
  if (error) return { error: dbErrorMessage(error, t) };
  if (!data?.length) return { error: notAdmin(t) };

  // Cloudinary'deki fotoğraf ve videoları da temizle ki kota boşa harcanmasın.
  await deleteFolder(mediaPrefix(groupId));
  redirect("/gruplar");
}
