import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import webpush, { WebPushError } from "web-push";
import { appUrl, serverEnv } from "@/lib/server-env";

// Telefon bildirimleri (Web Push). Bildirimi tarayıcının kendi servisi (Google,
// Apple, Mozilla, Microsoft) ücretsiz iletir. Anahtar çifti (VAPID) ilk kullanımda
// üretilip app_secrets tablosunda saklanır; kurulumda ayrıca bir ayar gerekmez.

export interface PushMessage {
  title: string;
  body: string;
  /** Bildirime dokununca açılacak sayfa (site içi yol) */
  url: string;
  /** Aynı etiketli yeni bildirim öncekinin yerine geçer */
  tag: string;
}

export interface PushTarget {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushResult {
  sent: number;
  /** Kalıcı olarak geçersiz olduğu için silinen cihazlar */
  gone: number;
  failed: number;
}

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

let cachedKeys: VapidKeys | null = null;

function parseKeys(value: string | null | undefined): VapidKeys | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<VapidKeys>;
    return parsed.publicKey && parsed.privateKey ? { publicKey: parsed.publicKey, privateKey: parsed.privateKey } : null;
  } catch {
    return null;
  }
}

/** Anahtar çifti tek satırda tutulur: aynı anda iki istek üretse bile ilk kaydedilen çift kullanılır. */
async function vapidKeys(admin: SupabaseClient): Promise<VapidKeys> {
  if (cachedKeys) return cachedKeys;
  const read = async () => {
    const { data, error } = await admin.from("app_secrets").select("value").eq("key", "vapid").maybeSingle();
    if (error) throw error;
    return parseKeys(data?.value);
  };
  let keys = await read();
  if (!keys) {
    const { error } = await admin
      .from("app_secrets")
      .upsert({ key: "vapid", value: JSON.stringify(webpush.generateVAPIDKeys()) }, { onConflict: "key", ignoreDuplicates: true });
    if (error) throw error;
    keys = await read();
    if (!keys) throw new Error("Bildirim anahtarları kaydedilemedi.");
  }
  cachedKeys = keys;
  return keys;
}

/** Tarayıcının abone olurken kullandığı açık anahtar. Bildirim tabloları henüz yoksa null. */
export async function vapidPublicKey(admin: SupabaseClient): Promise<string | null> {
  try {
    return (await vapidKeys(admin)).publicKey;
  } catch (error) {
    console.error("[bildirim] anahtar alınamadı", error);
    return null;
  }
}

/** Bildirim servislerine "bu bildirimleri kim gönderiyor" bilgisi (https ya da mailto olmalı). */
function subject(): string {
  const url = appUrl();
  if (url.startsWith("https://")) return url;
  return `mailto:${serverEnv.gmailUser ?? "noreply@example.com"}`;
}

/** Mesajı verilen cihazlara gönderir; artık geçersiz olan cihazları siler. */
export async function sendPush(admin: SupabaseClient, targets: PushTarget[], message: PushMessage): Promise<PushResult> {
  const result: PushResult = { sent: 0, gone: 0, failed: 0 };
  if (!targets.length) return result;
  const keys = await vapidKeys(admin);
  const gone: string[] = [];

  await Promise.all(
    targets.map(async (target) => {
      try {
        await webpush.sendNotification(
          { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
          JSON.stringify(message),
          {
            vapidDetails: { subject: subject(), publicKey: keys.publicKey, privateKey: keys.privateKey },
            // Telefon kapalıysa bildirim bir gün bekler.
            TTL: 24 * 60 * 60,
            timeout: 10_000,
          },
        );
        result.sent += 1;
      } catch (error) {
        const status = error instanceof WebPushError ? error.statusCode : null;
        // 404/410: kullanıcı izni kaldırdı ya da tarayıcı aboneliği yeniledi.
        if (status === 404 || status === 410) {
          gone.push(target.id);
        } else {
          result.failed += 1;
          console.error("[bildirim] gönderilemedi", status, error instanceof Error ? error.message : error);
        }
      }
    }),
  );

  if (gone.length) {
    result.gone = gone.length;
    await admin.from("push_subscriptions").delete().in("id", gone);
  }
  return result;
}
