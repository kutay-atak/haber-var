import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/utils";

// Google girişi ve şifre yenileme linkleri buraya döner.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next")) ?? "/gruplar";

  // Supabase bir sorun olunca kodu değil hatanın açıklamasını gönderir.
  let reason = searchParams.get("error_description") ?? searchParams.get("error") ?? "";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Google ile ilk kez gelen kişinin e-postaları da sitede gördüğü dilde gitsin.
      if (!isLocale(data.user?.user_metadata?.locale)) {
        await supabase.auth.updateUser({ data: { locale: await getLocale() } });
      }
      return NextResponse.redirect(new URL(next, origin));
    }
    reason = error.message;
  }

  console.error("[giriş] dönüş başarısız", { code: Boolean(code), reason, host: request.headers.get("host") });
  const fail = new URL("/giris", origin);
  fail.searchParams.set("hata", "baglanti");
  if (reason) fail.searchParams.set("neden", reason.slice(0, 200));
  return NextResponse.redirect(fail);
}
