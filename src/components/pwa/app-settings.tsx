"use client";

import { BellOff, BellRing, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { useT } from "@/components/i18n";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InstallSteps } from "./install-steps";
import { usePush } from "./pwa";

/** Profil sayfasında: ana ekrana ekleme ve bu cihazın bildirim ayarı. */
export function AppSettings({ vapidKey }: { vapidKey: string | null }) {
  const t = useT();
  const push = usePush(vapidKey);
  const { pwa } = push;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">📲 {t("Ana ekrana ekle", "Add to home screen")}</h2>
          <p className="text-sm text-ink-soft">
            {t(
              "Haber Var telefonunda uygulama gibi açılsın: kendi simgesi olur, tarayıcı çubuğu görünmez. Mağazadan indirmek gerekmez.",
              "Use Haber Var like an app on your phone: it gets its own icon and opens without the browser bar. No app store needed.",
            )}
          </p>
        </div>
        {pwa.ready ? <InstallSteps pwa={pwa} /> : null}
      </section>

      {vapidKey ? (
        <section className="space-y-3 border-t border-line pt-5">
          <div>
            <h2 className="text-lg font-bold">🔔 {t("Bu cihazda bildirimler", "Notifications on this device")}</h2>
            <p className="text-sm text-ink-soft">
              {t(
                "Yeni sayı başlayınca, son gün henüz yazmadıysan ve gazete çıkınca telefonuna bildirim gelir. E-posta ayarından bağımsızdır.",
                "Get a notification when a new issue starts, on the last day if you haven't written yet, and when the newspaper is out. Separate from the email setting.",
              )}
            </p>
          </div>

          {push.status === "loading" ? (
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> {t("Kontrol ediliyor…", "Checking…")}
            </p>
          ) : push.status === "unsupported" ? (
            <Alert tone="info">
              {t(
                "Bu tarayıcı bildirimleri desteklemiyor. Telefonunda Chrome ya da Safari ile dene.",
                "This browser doesn't support notifications. Try Chrome or Safari on your phone.",
              )}
            </Alert>
          ) : push.status === "needs-install" ? (
            <Alert tone="info">
              {t(
                "iPhone'da bildirimler için önce Haber Var'ı yukarıdaki adımlarla ana ekrana ekle. Sonra ana ekrandaki simgeden açıp bu sayfadan bildirimleri aç.",
                "On iPhone, first add Haber Var to your home screen using the steps above. Then open it from the home screen icon and turn on notifications here.",
              )}
            </Alert>
          ) : push.status === "denied" ? (
            <Alert tone="error">
              {t(
                "Bu cihazda bildirimlere izin verilmemiş. Tarayıcının (ya da telefonun) ayarlarından bu site için bildirimlere izin verip sayfayı yenile.",
                "Notifications are blocked on this device. Allow them for this site in your browser (or phone) settings, then refresh the page.",
              )}
            </Alert>
          ) : push.status === "on" ? (
            <div className="flex flex-wrap items-center gap-2">
              <p className="mr-2 flex items-center gap-2 font-semibold text-sage-deep">
                <CircleCheck className="size-5" aria-hidden="true" /> {t("Açık", "On")}
              </p>
              <Button variant="secondary" size="sm" onClick={push.test} disabled={push.busy}>
                <Send className="size-4" aria-hidden="true" /> {t("Deneme bildirimi gönder", "Send a test notification")}
              </Button>
              <Button variant="ghost" size="sm" onClick={push.disable} disabled={push.busy}>
                <BellOff className="size-4" aria-hidden="true" /> {t("Kapat", "Turn off")}
              </Button>
            </div>
          ) : (
            <Button onClick={push.enable} disabled={push.busy}>
              <BellRing className="size-5" aria-hidden="true" /> {push.busy ? t("Açılıyor…", "Turning on…") : t("Bildirimleri aç", "Turn on notifications")}
            </Button>
          )}

          {push.message ? <Alert tone={push.message.tone}>{push.message.text}</Alert> : null}
        </section>
      ) : null}
    </div>
  );
}
