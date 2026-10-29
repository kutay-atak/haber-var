import { createBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

/** Tarayıcıda çalışan Supabase istemcisi (şimdilik sadece Google girişi için). */
export function createClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseKey);
}
