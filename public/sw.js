// Haber Var service worker: telefon bildirimleri ve bağlantı yokken gösterilen sayfa.
// Sayfaları önbelleğe almaz; sadece açılış isteği başarısız olursa offline.html gösterir.
const CACHE = "haber-var-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error()));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Haber Var", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/badge-96.png",
      tag: data.tag,
      data: { url: data.url || "/gruplar" },
    }),
  );
});

// Bildirime dokununca: sayfa zaten açıksa ona geç, değilse yeni pencerede aç.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/gruplar", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
      const same = windows.find((w) => w.url === target);
      if (same) return same.focus();
      const ours = windows.find((w) => new URL(w.url).origin === self.location.origin && "navigate" in w);
      if (ours) {
        try {
          await ours.focus();
          return await ours.navigate(target);
        } catch {
          // Sayfa bu service worker'a bağlı değilse yeni pencere aç.
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
