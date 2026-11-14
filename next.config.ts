import type { NextConfig } from "next";

// Site başka bir adresten (ör. cloudflare-worker.js'deki …workers.dev) de açılıyorsa
// formlar oradan da çalışsın. Next, form gönderimlerinde tarayıcının adresiyle sunucunun
// adresini karşılaştırır; sitenin asıl adresi (NEXT_PUBLIC_APP_URL) güvenli sayılır.
function publicHost(): string[] {
  try {
    return process.env.NEXT_PUBLIC_APP_URL ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host] : [];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Uygulamanın neredeyse her sayfası giriş yapmış kullanıcıya özel olduğu için
  // Next 16'nın Cache Components modelini bilinçli olarak kullanmıyoruz:
  // sayfalar her istekte sunucuda oluşturulur, bu da kodu sade tutar.
  poweredByHeader: false,
  experimental: {
    serverActions: { allowedOrigins: publicHost() },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
