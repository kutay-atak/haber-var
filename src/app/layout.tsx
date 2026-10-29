import type { Metadata, Viewport } from "next";
import { caveat, fraunces, nunito } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Haber Var · Dostlarınla ortak gazete",
    template: "%s · Haber Var",
  },
  description:
    "Uzaktaki arkadaşlarınla aynı soruları yanıtlayın; süre dolunca herkesin yazıları, fotoğrafları ve videoları tek bir gazetede buluşsun.",
  applicationName: "Haber Var",
  appleWebApp: { title: "Haber Var", capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#fff8f0",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${fraunces.variable} ${nunito.variable} ${caveat.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
