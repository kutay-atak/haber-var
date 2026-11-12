"use client";

import { LoaderCircle, Send } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { setEmailOptIn } from "@/actions/profile";
import { useT } from "@/components/i18n";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { InstallSteps } from "./install-steps";
import { usePush } from "./pwa";

/** Başlık, açıklama ve sağda anahtar. Yazıya dokunmak da anahtarı çevirir. */
function SettingRow({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-ink-soft">{hint}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 pt-0.5">{children}</span>
    </label>
  );
}

/** Profil sayfasında: ana ekrana ekleme ve bildirim ayarları (e-posta + bu cihaz). */
export function AppSettings({ vapidKey, emailOptIn }: { vapidKey: string | null; emailOptIn: boolean }) {
  const t = useT();
  const push = usePush(vapidKey);
  const { pwa } = push;
  const [emailOn, setEmailOn] = useState(emailOptIn);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, startSaving] = useTransition();

  function toggleEmail(on: boolean) {
    setEmailOn(on);
    setEmailError(null);
    startSaving(async () => {
      const { error } = await setEmailOptIn(on);
      if (error) {
        setEmailOn(!on);
        setEmailError(error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">📲 {t("Ana ekrana ekle", "Add to home screen")}</h2>
          <p className="text-sm text-ink-soft">
            {t(
              "Ana ekrana ekleyince Haber Var uygulama gibi açılır.",
              "Add Haber Var to your home screen and it opens like an app.",
            )}
          </p>
        </div>
        {pwa.ready ? <InstallSteps pwa={pwa} /> : null}
      </section>

      <section className="space-y-4 border-t border-line pt-5">
        <h2 className="text-lg font-bold">🔔 {t("Bildirim ayarları", "Notification settings")}</h2>

        <SettingRow
          title={t("E-posta bildirimleri", "Email notifications")}
          hint={t(
            "Yeni sayı başlayınca, son gün ve gazete çıkınca e-posta gelir.",
            "An email when a new issue starts, on the last day and when the newspaper is out.",
          )}
        >
          <Switch
            checked={emailOn}
            onChange={toggleEmail}
            label={t("E-posta bildirimleri", "Email notifications")}
            disabled={savingEmail}
          />
        </SettingRow>
        {emailError ? <Alert tone="error">{emailError}</Alert> : null}

        {vapidKey ? (
          <div className="space-y-3">
            <SettingRow
              title={t("Mobil bildirimler", "Mobile notifications")}
              hint={t(
                "Yeni sayı başlayınca, son gün, gazete çıkınca ve yanıtına yorum ya da tepki gelince bu cihaza bildirim gelir.",
                "A notification on this device when a new issue starts, on the last day, when the newspaper is out and when someone comments on or reacts to your answer.",
              )}
            >
              {push.status === "loading" || push.busy ? (
                <LoaderCircle className="size-4 animate-spin text-ink-soft" aria-hidden="true" />
              ) : null}
              <Switch
                checked={push.status === "on"}
                onChange={(on) => void (on ? push.enable() : push.disable())}
                label={t("Mobil bildirimler", "Mobile notifications")}
                disabled={push.busy || (push.status !== "on" && push.status !== "off")}
              />
            </SettingRow>

            {push.status === "unsupported" ? (
              <Alert tone="info">
                {t(
                  "Bu tarayıcı bildirimleri desteklemiyor. Telefonunda Chrome ya da Safari ile dene.",
                  "This browser doesn't support notifications. Try Chrome or Safari on your phone.",
                )}
              </Alert>
            ) : push.status === "needs-install" ? (
              <Alert tone="info">
                {t(
                  "iPhone'da bildirimler için önce Haber Var'ı yukarıdaki adımlarla ana ekrana ekle. Sonra ana ekrandaki simgeden açıp bu anahtarı aç.",
                  "On iPhone, first add Haber Var to your home screen using the steps above. Then open it from the home screen icon and turn this switch on.",
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
              <Button variant="secondary" size="sm" onClick={push.test} disabled={push.busy}>
                <Send className="size-4" aria-hidden="true" /> {t("Deneme bildirimi gönder", "Send a test notification")}
              </Button>
            ) : null}

            {/* İzin reddedilince yukarıdaki uyarı yeterli; aynı şeyi iki kez yazmayalım. */}
            {push.message && push.status !== "denied" ? <Alert tone={push.message.tone}>{push.message.text}</Alert> : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
