import type { Metadata, Viewport } from "next";
import { LocaleProvider } from "@/components/i18n";
import { PwaSetup } from "@/components/pwa/pwa";
import { getLocale, getT } from "@/lib/i18n-server";
import { INSTALL_PROMPT_SCRIPT } from "@/lib/pwa";
import { caveat, fraunces, nunito } from "./fonts";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    title: {
      default: t("Haber Var · Dostlarınla ortak gazete", "Haber Var · A shared newspaper with your friends"),
      template: "%s · Haber Var",
    },
    description: t(
      "Uzaktaki arkadaşlarınla aynı soruları yanıtlayın; süre dolunca herkesin yazıları, fotoğrafları ve videoları tek bir gazetede buluşsun.",
      "Answer the same questions with friends far away; when time is up, everyone's stories, photos and videos come together in one newspaper.",
    ),
    applicationName: "Haber Var",
    appleWebApp: { title: "Haber Var", capable: true, statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: "#fff8f0",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${fraunces.variable} ${nunito.variable} ${caveat.variable}`}>
      <head>
        {/* Next'in Script bileşeni satır içi betikleri sonraya bırakıyor; bu hemen çalışmalı. */}
        <script dangerouslySetInnerHTML={{ __html: INSTALL_PROMPT_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
        <PwaSetup />
      </body>
    </html>
  );
}
