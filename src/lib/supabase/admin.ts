import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";

/**
 * RLS'i atlayan yönetici istemcisi. Sadece sunucu tarafında, yetki kontrolü
 * zaten yapılmış işlerde kullan (medya kaydı, e-posta gönderimi, zamanlanmış iş).
 */
export function createAdminClient() {
  return createClient(publicEnv.supabaseUrl, serverEnv.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
