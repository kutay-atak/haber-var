"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { deletePushSubscription, savePushSubscription, sendTestPush } from "@/actions/push";
import { useT } from "@/components/i18n";

// "Ana ekrana ekle" ve telefon bildirimleri. Tarayıcının yükleme isteği
// (beforeinstallprompt) sayfa açılırken gelir; lib/pwa.ts'teki küçük betik
// onu window.__hvInstallPrompt içinde saklar ve "hv:installable" olayını yayar.

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __hvInstallPrompt?: InstallPromptEvent | null;
    __hvInstalled?: boolean;
  }
}

export type Platform = "ios" | "android" | "desktop";

export interface PwaSnapshot {
  /** Tarayıcıda ölçüldü mü? Sunucuda ve ilk çizimde false. */
  ready: boolean;
  platform: Platform;
  /** Ana ekrandaki simgeden açılmış */
  standalone: boolean;
  /** Tek dokunuşla yükleme mümkün (Android'de Chrome, Samsung Internet, Edge…) */
  canInstall: boolean;
  /** Bu oturumda yüklendi */
  installed: boolean;
}

const SERVER_SNAPSHOT: PwaSnapshot = { ready: false, platform: "desktop", standalone: false, canInstall: false, installed: false };
let snapshot: PwaSnapshot | null = null;
const listeners = new Set<() => void>();
const STANDALONE_QUERY = "(display-mode: standalone)";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS kendini Mac olarak tanıtır; dokunmatik ekranından ayırt edilir.
  if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return /Android/i.test(ua) ? "android" : "desktop";
}

function measure(): PwaSnapshot {
  const standalone =
    window.matchMedia(STANDALONE_QUERY).matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return {
    ready: true,
    platform: detectPlatform(),
    standalone,
    canInstall: !standalone && !!window.__hvInstallPrompt,
    installed: !!window.__hvInstalled,
  };
}

function refresh() {
  snapshot = measure();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("hv:installable", refresh);
    window.addEventListener("hv:installed", refresh);
    window.matchMedia(STANDALONE_QUERY).addEventListener("change", refresh);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener("hv:installable", refresh);
      window.removeEventListener("hv:installed", refresh);
      window.matchMedia(STANDALONE_QUERY).removeEventListener("change", refresh);
    }
  };
}

export function usePwa(): PwaSnapshot {
  return useSyncExternalStore(
    subscribe,
    () => (snapshot ??= measure()),
    () => SERVER_SNAPSHOT,
  );
}

/** Tarayıcının yükleme penceresini açar. Kişi yüklerse true. */
export async function installApp(): Promise<boolean> {
  const prompt = window.__hvInstallPrompt;
  if (!prompt) return false;
  // Bir yükleme isteği sadece bir kez kullanılabilir.
  window.__hvInstallPrompt = null;
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  if (outcome === "accepted") window.__hvInstalled = true;
  refresh();
  return outcome === "accepted";
}

/** Service worker'ı kaydeder (kök düzende bir kez). */
export function PwaSetup() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

/** Service worker hazır olana kadar bekler; kayıt başarısız olduysa null. */
async function serviceWorker(timeoutMs = 8000): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

/** Abonelik başka bir anahtarla yapılmışsa sunucunun bildirimleri ulaşmaz; yenilemek gerekir. */
function sameKey(subscription: PushSubscription, key: Uint8Array) {
  const current = subscription.options?.applicationServerKey;
  if (!current) return true;
  const bytes = new Uint8Array(current);
  return bytes.length === key.length && bytes.every((b, i) => b === key[i]);
}

export type PushStatus = "loading" | "unsupported" | "needs-install" | "denied" | "off" | "on";

interface PushState {
  status: PushStatus;
  endpoint: string | null;
}

async function readPushState(vapidKey: string | null, pwa: PwaSnapshot): Promise<PushState> {
  if (!vapidKey) return { status: "unsupported", endpoint: null };
  if (!pushSupported()) {
    // iPhone'da bildirimler sadece ana ekrana eklenen sitede çalışır.
    return { status: pwa.platform === "ios" && !pwa.standalone ? "needs-install" : "unsupported", endpoint: null };
  }
  if (Notification.permission === "denied") return { status: "denied", endpoint: null };
  const registration = await serviceWorker();
  if (!registration) return { status: "unsupported", endpoint: null };
  const subscription = await registration.pushManager.getSubscription();
  return subscription && Notification.permission === "granted"
    ? { status: "on", endpoint: subscription.endpoint }
    : { status: "off", endpoint: null };
}

/** Bu cihazın bildirim durumu ve aç/kapat/dene işlemleri. */
export function usePush(vapidKey: string | null) {
  const pwa = usePwa();
  const t = useT();
  const [state, setState] = useState<PushState>({ status: "loading", endpoint: null });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!pwa.ready) return;
    let cancelled = false;
    readPushState(vapidKey, pwa)
      .then((next) => {
        if (!cancelled) setState(next);
      })
      .catch(() => {
        if (!cancelled) setState({ status: "unsupported", endpoint: null });
      });
    return () => {
      cancelled = true;
    };
  }, [vapidKey, pwa]);

  async function enable() {
    if (!vapidKey) return;
    setBusy(true);
    setMessage(null);
    try {
      // İzin penceresi dokunuşun hemen ardından açılmalı (Safari bunu şart koşar).
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState({ status: permission === "denied" ? "denied" : "off", endpoint: null });
        setMessage({
          tone: "error",
          text: t(
            "Bildirim izni verilmedi. Fikrini değiştirirsen tarayıcının site ayarlarından izin verebilirsin.",
            "Notification permission wasn't granted. If you change your mind, allow it in the browser's site settings.",
          ),
        });
        return;
      }
      const registration = await serviceWorker();
      if (!registration) throw new Error("service worker yok");
      const key = keyBytes(vapidKey);
      let subscription = await registration.pushManager.getSubscription();
      if (subscription && !sameKey(subscription, key)) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      const result = await savePushSubscription(subscription.toJSON(), true);
      if (!result.ok) {
        await subscription.unsubscribe().catch(() => {});
        setState({ status: "off", endpoint: null });
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setState({ status: "on", endpoint: subscription.endpoint });
      setMessage({ tone: "success", text: t("Bildirimler açıldı! 🎉", "Notifications are on! 🎉") });
    } catch {
      setMessage({
        tone: "error",
        text: t("Bildirimler açılamadı. Sayfayı yenileyip tekrar dene.", "Couldn't turn on notifications. Refresh the page and try again."),
      });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const subscription = await (await serviceWorker())?.pushManager.getSubscription();
      if (subscription) {
        await deletePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState({ status: "off", endpoint: null });
      setMessage({ tone: "success", text: t("Bu cihazda bildirimler kapatıldı.", "Notifications are off on this device.") });
    } catch {
      setMessage({ tone: "error", text: t("Bildirimler kapatılamadı. Tekrar dene.", "Couldn't turn off notifications. Try again.") });
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    if (!state.endpoint) return;
    setBusy(true);
    setMessage(null);
    const result = await sendTestPush(state.endpoint);
    setBusy(false);
    setMessage(
      result.ok
        ? { tone: "success", text: t("Gönderildi! Birkaç saniye içinde gelmeli.", "Sent! It should arrive in a few seconds.") }
        : { tone: "error", text: result.error },
    );
  }

  return { pwa, status: state.status, busy, message, enable, disable, test };
}

/**
 * Tarayıcı aboneliği yenilediyse ya da sunucudaki kayıt silindiyse oturum başına bir kez
 * yeniden kaydeder. Aynı telefonda başka hesapla girildiyse cihaz o hesaba geçer.
 */
export function PushSync({ userId }: { userId: string }) {
  useEffect(() => {
    if (!pushSupported() || Notification.permission !== "granted") return;
    const key = `hv-push-sync:${userId}`;
    try {
      if (window.sessionStorage.getItem(key)) return;
      window.sessionStorage.setItem(key, "1");
    } catch {
      // Gizli sekmede depolama kapalı olabilir; her açılışta kaydetmek de sorun değil.
    }
    void serviceWorker()
      .then((registration) => registration?.pushManager.getSubscription())
      .then((subscription) => (subscription ? savePushSubscription(subscription.toJSON()) : null))
      .catch(() => {});
  }, [userId]);
  return null;
}

/** Çıkış yaparken: bu cihaz artık bu hesabın bildirimlerini almasın. Hata çıkışı engellemez. */
export async function forgetThisDevice() {
  try {
    if (!pushSupported()) return;
    const subscription = await (await serviceWorker(2000))?.pushManager.getSubscription();
    if (!subscription) return;
    await deletePushSubscription(subscription.endpoint);
    await subscription.unsubscribe();
  } catch {
    // Bildirim kaydı silinemese de çıkış devam eder.
  }
}
