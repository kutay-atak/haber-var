import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Giriş yapmadan açılamayan sayfalar.
const PROTECTED_PREFIXES = ["/gruplar", "/sayi", "/profil", "/sifre-yenile"];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Supabase oturum çerezini tazeler ve korumalı sayfaları giriş sayfasına yönlendirir. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  // Kurulum tamamlanmadan da açılış sayfası görünebilsin.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // Not: createServerClient ile getClaims arasına başka kod koyma;
  // oturumun tazelenmesi bu çağrıya bağlı.
  let isLoggedIn = false;
  try {
    const { data } = await supabase.auth.getClaims();
    isLoggedIn = Boolean(data?.claims?.sub);
  } catch {
    isLoggedIn = false;
  }

  const { pathname, search } = request.nextUrl;
  if (!isLoggedIn && isProtected(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/giris";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
