import type { MetadataRoute } from "next";

// Telefonda "Ana ekrana ekle" ile uygulama gibi açılabilsin.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Haber Var",
    short_name: "Haber Var",
    description: "Uzaktaki arkadaşlarla ortak dijital gazete.",
    lang: "tr",
    start_url: "/gruplar",
    display: "standalone",
    background_color: "#fff8f0",
    theme_color: "#fff8f0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
