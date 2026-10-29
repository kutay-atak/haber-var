import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uygulamanın neredeyse her sayfası giriş yapmış kullanıcıya özel olduğu için
  // Next 16'nın Cache Components modelini bilinçli olarak kullanmıyoruz:
  // sayfalar her istekte sunucuda oluşturulur, bu da kodu sade tutar.
  poweredByHeader: false,
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
