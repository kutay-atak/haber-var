"use client";

import { CircleCheck, EllipsisVertical, Share, Smartphone, SquarePlus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { installApp, type PwaSnapshot } from "./pwa";

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-terracotta-soft text-sm font-extrabold text-terracotta-deep">
        {n}
      </span>
      <span className="pt-0.5 leading-relaxed">{children}</span>
    </li>
  );
}

const icon = "mx-0.5 inline size-[1.1em] -translate-y-px align-middle";

/** Platforma göre ana ekrana ekleme yolu: tek dokunuşluk düğme ya da kısa tarif. */
export function InstallSteps({ pwa }: { pwa: PwaSnapshot }) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  if (pwa.standalone || pwa.installed) {
    return (
      <p className="flex items-center gap-2 font-semibold text-sage-deep">
        <CircleCheck className="size-5" aria-hidden="true" />
        {pwa.standalone
          ? t("Haber Var'ı ana ekrandan kullanıyorsun.", "You're using Haber Var from your home screen.")
          : t("Yüklendi! Ana ekranındaki Haber Var simgesinden açabilirsin.", "Installed! Open it from the Haber Var icon on your home screen.")}
      </p>
    );
  }

  if (pwa.canInstall) {
    return (
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await installApp();
          setBusy(false);
        }}
      >
        <Smartphone className="size-5" aria-hidden="true" /> {t("Uygulamayı yükle", "Install the app")}
      </Button>
    );
  }

  if (pwa.platform === "ios") {
    return (
      <ol className="space-y-2.5 text-[0.95rem]">
        <Step n={1}>
          {t("Safari'de", "In Safari, tap")} <Share className={icon} aria-hidden="true" /> <strong>{t("Paylaş", "Share")}</strong>
          {t(" düğmesine dokun. (Görmüyorsan önce ••• düğmesine dokun.)", ". (If you don't see it, tap ••• first.)")}
        </Step>
        <Step n={2}>
          {t("", "Choose ")}
          <SquarePlus className={icon} aria-hidden="true" /> <strong>{t("Ana Ekrana Ekle", "Add to Home Screen")}</strong>
          {t("'yi seç ve Ekle'ye dokun.", ", then tap Add.")}
        </Step>
        <Step n={3}>{t("Ana ekranındaki Haber Var simgesinden aç.", "Open Haber Var from your home screen.")}</Step>
      </ol>
    );
  }

  if (pwa.platform === "android") {
    return (
      <ol className="space-y-2.5 text-[0.95rem]">
        <Step n={1}>
          {t("Tarayıcının", "Open the browser's")} <EllipsisVertical className={icon} aria-hidden="true" />{" "}
          {t("menüsünü aç.", "menu.")}
        </Step>
        <Step n={2}>
          {t("", "Choose ")}
          <strong>{t("Uygulamayı yükle", "Install app")}</strong> {t("ya da", "or")}{" "}
          <strong>{t("Ana ekrana ekle", "Add to Home screen")}</strong>
          {t("'yi seç.", ".")}
        </Step>
      </ol>
    );
  }

  return (
    <p className="text-[0.95rem] text-ink-soft">
      {t(
        "Telefonunda bu siteyi aç ve ana ekranına ekle; uygulama gibi açılır.",
        "Open this site on your phone and add it to your home screen; it opens like an app.",
      )}
    </p>
  );
}
