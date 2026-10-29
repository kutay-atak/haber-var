import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * Giriş yapmış kullanıcının yetkileriyle çalışan Supabase istemcisi.
 * Tüm sorgular RLS politikalarından geçer. Her istekte yeniden oluştur.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component içinden çağrıldığında çerez yazılamaz.
          // Sorun değil: oturumu src/proxy.ts her istekte tazeler.
        }
      },
    },
  });
}
