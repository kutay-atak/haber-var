import "server-only";
import { missingEnv } from "@/lib/env";

// Sadece sunucuda okunan gizli ayarlar. Bu dosya tarayıcı koduna giremez.
export const serverEnv = {
  get supabaseSecretKey() {
    return process.env.SUPABASE_SECRET_KEY || missingEnv("SUPABASE_SECRET_KEY");
  },
  get cloudinaryApiKey() {
    return process.env.CLOUDINARY_API_KEY || missingEnv("CLOUDINARY_API_KEY");
  },
  get cloudinaryApiSecret() {
    return process.env.CLOUDINARY_API_SECRET || missingEnv("CLOUDINARY_API_SECRET");
  },
  get gmailUser() {
    return process.env.GMAIL_USER || null;
  },
  get gmailAppPassword() {
    // Google uygulama şifresini boşluklu gösterir; boşluklar önemsiz.
    return process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "") || null;
  },
  get cronSecret() {
    return process.env.CRON_SECRET || null;
  },
};

/** E-postalardaki linkler için uygulamanın tam adresi (sonunda / olmadan). */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
