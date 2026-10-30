"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { getT } from "@/lib/i18n-server";
import { skipPastPushEvents } from "@/lib/notifications";
import { sendPush, type PushTarget } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

/** Tarayıcının PushSubscription.toJSON() çıktısı */
const subscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/**
 * Bu cihazı bildirim almak için kaydeder. justEnabled: kişi bildirimleri şimdi açtı;
 * zaten açık olan ya da yeni yayımlanmış sayılar için ayrıca bildirim gelmesin.
 */
export async function savePushSubscription(subscription: unknown, justEnabled = false): Promise<Result> {
  const user = await requireUser();
  const t = await getT();
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) {
    return { ok: false, error: t("Bu tarayıcı bildirimleri desteklemiyor.", "This browser doesn't support notifications.") };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_push_subscription", {
    p_endpoint: parsed.data.endpoint,
    p_p256dh: parsed.data.keys.p256dh,
    p_auth: parsed.data.keys.auth,
    p_user_agent: (await headers()).get("user-agent")?.slice(0, 300) ?? null,
  });
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  if (justEnabled) await skipPastPushEvents(user.id);
  return { ok: true };
}

/** Bu cihazın bildirimlerini kapatır (çıkış yaparken de çağrılır). */
export async function deletePushSubscription(endpoint: string): Promise<Result> {
  await requireUser();
  const t = await getT();
  if (!z.url().safeParse(endpoint).success) return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  return { ok: true };
}

/** Bu cihaza bir deneme bildirimi gönderir. */
export async function sendTestPush(endpoint: string): Promise<Result> {
  await requireUser();
  const t = await getT();
  if (!z.url().safeParse(endpoint).success) return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  const supabase = await createClient();
  // RLS: sadece kendi cihazların görünür.
  const { data: target } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("endpoint", endpoint)
    .maybeSingle();
  const notRegistered = t(
    "Bu cihazın kaydı bulunamadı. Bildirimleri kapatıp yeniden aç.",
    "This device isn't registered. Turn notifications off and on again.",
  );
  if (!target) return { ok: false, error: notRegistered };

  const result = await sendPush(createAdminClient(), [target as PushTarget], {
    title: "Haber Var",
    body: t("Bildirimler bu cihazda çalışıyor.", "Notifications work on this device."),
    url: "/profil",
    tag: "test",
  });
  if (result.sent) return { ok: true };
  if (result.gone) return { ok: false, error: notRegistered };
  return { ok: false, error: t("Bildirim gönderilemedi. Biraz sonra tekrar dene.", "Couldn't send the notification. Try again in a moment.") };
}
