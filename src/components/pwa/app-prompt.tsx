"use client";

import { BellRing, X } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import { useT } from "@/components/i18n";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InstallSteps } from "./install-steps";
import { usePush } from "./pwa";

// "Daha sonra" denen öneri 30 gün görünmez. Depolama kapalıysa en azından bu oturumda gizli kalır.
const HIDE_DAYS = 30;
const hiddenThisSession = new Set<string>();

function isHidden(key: string) {
  if (hiddenThisSession.has(key)) return true;
  try {
    const at = Number(window.localStorage.getItem(`hv-hidden:${key}`));
    return at > 0 && Date.now() - at < HIDE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function subscribeHidden(callback: () => void) {
  window.addEventListener("hv:hidden", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("hv:hidden", callback);
    window.removeEventListener("storage", callback);
  };
}

function useHidden(key: string): [boolean, () => void] {
  const hidden = useSyncExternalStore(
    subscribeHidden,
    () => isHidden(key),
    () => true,
  );
  const hide = () => {
    hiddenThisSession.add(key);
    try {
      window.localStorage.setItem(`hv-hidden:${key}`, String(Date.now()));
    } catch {
      // Gizli sekme: sadece bu oturumda gizli kalır.
    }
    window.dispatchEvent(new Event("hv:hidden"));
  };
  return [hidden, hide];
}

function PromptCard({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  const t = useT();
  return (
    <section className="relative mb-8 space-y-3 rounded-[1.75rem] border border-sage/40 bg-sage-soft/60 p-5 pr-12 shadow-soft sm:p-6 sm:pr-14">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-full p-2 text-ink-soft transition hover:bg-white/70 hover:text-ink"
        aria-label={t("Daha sonra", "Later")}
        title={t("Daha sonra", "Later")}
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </section>
  );
}

/** Gruplar sayfasında: telefonda önce "ana ekrana ekle", sonra "bildirimleri aç" önerisi. */
export function AppPrompt({ vapidKey }: { vapidKey: string | null }) {
  const t = useT();
  const push = usePush(vapidKey);
  const { pwa } = push;
  const [installHidden, hideInstall] = useHidden("install");
  const [pushHidden, hidePush] = useHidden("push");
  if (!pwa.ready) return null;

  if (pwa.platform !== "desktop" && !pwa.standalone && !installHidden) {
    return (
      <PromptCard title={`📲 ${t("Haber Var'ı telefonuna ekle", "Add Haber Var to your phone")}`} onClose={hideInstall}>
        <p className="text-ink-soft">
          {t(
            "Ana ekranından tek dokunuşla açılır, uygulama gibi çalışır. Mağazadan indirmen gerekmez.",
            "It opens from your home screen with one tap and works like an app. No app store needed.",
          )}
        </p>
        <InstallSteps pwa={pwa} />
      </PromptCard>
    );
  }

  const offered = push.status === "off" || (push.message && push.status !== "loading");
  if (!offered || pushHidden) return null;
  return (
    <PromptCard title={`🔔 ${t("Yeni sayı başlayınca haber verelim mi?", "Want a heads-up when a new issue starts?")}`} onClose={hidePush}>
      <p className="text-ink-soft">
        {t(
          "Bu cihaza bildirim gönderelim: yeni sayı başlayınca, son gün henüz yazmadıysan ve gazete çıkınca.",
          "We'll notify this device when a new issue starts, on the last day if you haven't written yet, and when the newspaper is out.",
        )}
      </p>
      {push.status === "off" ? (
        <Button onClick={push.enable} disabled={push.busy}>
          <BellRing className="size-5" aria-hidden="true" /> {push.busy ? t("Açılıyor…", "Turning on…") : t("Bildirimleri aç", "Turn on notifications")}
        </Button>
      ) : null}
      {push.message ? <Alert tone={push.message.tone}>{push.message.text}</Alert> : null}
    </PromptCard>
  );
}
