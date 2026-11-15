import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { runBackup, saveDriveToken } from "@/lib/backup";
import { appUrl, serverEnv } from "@/lib/server-env";

// Google Drive yedeğini bir kez bağlamak için. Site sahibi tarayıcıda
// /api/yedek?anahtar=CRON_SECRET adresini açar; Google izin ister ve buraya
// döner. İlk yedek hemen alınır, sonrakiler günlük zamanlanmış işle gider.
export const maxDuration = 60;

const SCOPE = "https://www.googleapis.com/auth/drive.file";

// Google'a giden "state": CRON_SECRET'in kendisi değil, özeti. Dönüşte karşılaştırılır.
const stateOf = (secret: string) => createHash("sha256").update(`yedek:${secret}`).digest("hex");

export async function GET(request: NextRequest) {
  const secret = serverEnv.cronSecret;
  const clientId = serverEnv.googleClientId;
  const clientSecret = serverEnv.googleClientSecret;
  if (!secret || !clientId || !clientSecret) {
    return new Response("CRON_SECRET, GOOGLE_CLIENT_ID ve GOOGLE_CLIENT_SECRET tanımlı olmalı.", { status: 500 });
  }
  const redirectUri = `${appUrl()}/api/yedek`;
  const params = request.nextUrl.searchParams;

  // 1) Başlangıç: sahibi anahtarla gelir, Google'a yollanır.
  if (params.get("anahtar")) {
    if (params.get("anahtar") !== secret) return new Response("Yetkisiz", { status: 401 });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: SCOPE,
      access_type: "offline",
      prompt: "consent",
      state: stateOf(secret),
    }).toString();
    return NextResponse.redirect(url);
  }

  // 2) Dönüş: Google kodu verir, yenileme anahtarına çevrilip saklanır.
  const code = params.get("code");
  if (!code || params.get("state") !== stateOf(secret)) return new Response("Yetkisiz", { status: 401 });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const token = (await res.json()) as { refresh_token?: string; error_description?: string; error?: string };
  if (!res.ok || !token.refresh_token) {
    return new Response(`Google bağlantısı kurulamadı: ${token.error_description ?? token.error ?? res.status}`, { status: 500 });
  }
  await saveDriveToken(token.refresh_token);

  const summary = await runBackup(40_000);
  const media = summary.media ? `medya: ${summary.media.copied} kopyalandı, ${summary.media.pending} yarın devam edecek, ${summary.media.failed} hata` : "";
  return new Response(
    [
      "Google Drive bağlandı. Drive'ında \"Haber Var yedek\" klasörü oluştu.",
      summary.database === "ok" ? "Veritabanı yedeklendi." : `Veritabanı yedeği alınamadı: ${summary.error ?? "Vercel loglarına bak."}`,
      media,
      "Bundan sonra her gün zamanlanmış işle yenilenir.",
    ]
      .filter(Boolean)
      .join("\n"),
    { headers: { "content-type": "text/plain; charset=utf-8" } },
  );
}
