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
  }

  return NextResponse.redirect(new URL("/giris?hata=baglanti", origin));
}
