// Tarayıcıda da okunabilen ayarlar. Next.js, `process.env.NEXT_PUBLIC_*`
// ifadelerini derleme sırasında koda gömer; bu yüzden her biri açıkça yazılı.

export function missingEnv(name: string): never {
  throw new Error(
    `${name} ortam değişkeni eksik. .env.local dosyanı kontrol et (örnek için .env.example).`,
  );
}

export const publicEnv = {
  get supabaseUrl() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || missingEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseKey() {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      missingEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    );
  },
  get cloudinaryCloudName() {
    return (
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      missingEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME")
    );
  },
};

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
