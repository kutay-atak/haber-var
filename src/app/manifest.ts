import type { MetadataRoute } from "next";

// Telefonda "Ana ekrana ekle" ile uygulama gibi açılabilsin.
export default function manifest(): MetadataRoute.Manifest {
  return {
    // Kimlik değişmesin: telefona eklenmiş kopyalar bununla tanınır.
    id: "/gruplar",
    name: "Haber Var",
    short_name: "Haber Var",
    description: "Uzaktaki arkadaşlarla ortak dijital gazete. · A shared digital newspaper with friends far away.",
    lang: "tr",
    start_url: "/gruplar",
    display: "standalone",
    background_color: "#fff8f0",
    theme_color: "#fff8f0",
    categories: ["social", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
