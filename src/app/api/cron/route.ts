import { runBackup } from "@/lib/backup";
import { runNotifications } from "@/lib/notifications";
import { runSchedules } from "@/lib/schedule-runner";
import { serverEnv } from "@/lib/server-env";

// Vercel Cron her gün bu adresi çağırır (bkz. vercel.json).
// CRON_SECRET tanımlıysa Vercel isteğe "Authorization: Bearer <CRON_SECRET>" ekler.
// Süre: bildirimler için ilk dakika, kalanı Google Drive yedeği için.
export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = serverEnv.cronSecret;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Yetkisiz", { status: 401 });
  }
  try {
    // Önce zamanı gelen otomatik sayılar açılır; ardından e-postalar (yeni sayı duyurusu dahil) gider.
    const started = Date.now();
    const schedules = await runSchedules();
    const summary = await runNotifications();
    // Yedek en son: hata verse de bildirimler gitmiş olur. 4 dakikaya sığmayan medya yarına kalır.
    const backup = await runBackup(240_000 - (Date.now() - started));
    return Response.json({ ok: true, schedules, ...summary, backup });
  } catch (error) {
    console.error("[cron]", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
