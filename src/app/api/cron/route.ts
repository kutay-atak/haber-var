import { runNotifications } from "@/lib/notifications";
import { serverEnv } from "@/lib/server-env";

// Vercel Cron her gün bu adresi çağırır (bkz. vercel.json).
// CRON_SECRET tanımlıysa Vercel isteğe "Authorization: Bearer <CRON_SECRET>" ekler.
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = serverEnv.cronSecret;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Yetkisiz", { status: 401 });
  }
  try {
    const summary = await runNotifications();
    return Response.json({ ok: true, ...summary });
  } catch (error) {
    console.error("[cron]", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
