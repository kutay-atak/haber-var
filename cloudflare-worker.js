// Haber Var · Cloudflare Worker: siteye ikinci bir adres
//
// Bazı ülkelerde *.vercel.app adresleri açılmıyor. Bu küçük betik Cloudflare'in
// ücretsiz Workers hizmetinde çalışır ve kendi adresine (…workers.dev) gelen her
// isteği Vercel'deki siteye iletir; site ve veriler olduğu yerde kalır.
//
// Kurulum: Cloudflare → Workers & Pages → Create → Hello World → Deploy → Edit code,
// bu dosyanın tamamını yapıştır → Deploy. Sonra Instructions.md'deki
// "Siteye ikinci bir adres" bölümündeki diğer adımları yap.

const SITE = "https://haber-var.vercel.app";

const worker = {
  async fetch(request) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, SITE);
    // Yönlendirmeleri takip etme: tarayıcı yapsın ki adres çubuğu bizde kalsın.
    const upstream = await fetch(new Request(target, request), { redirect: "manual" });
    const headers = new Headers(upstream.headers);
    // Site kendi adresine yönlendirirse (giriş sayfası, Google dönüşü) bizim adrese çevir.
    const location = headers.get("location");
    if (location && location.startsWith(SITE)) headers.set("location", url.origin + location.slice(SITE.length));
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers });
  },
};

export default worker;
