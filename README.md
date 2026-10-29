# 📰 Haber Var

Uzaktaki arkadaşlarınla periyodik olarak aynı soruları yanıtladığın, süre dolunca herkesin yazılarının, fotoğraflarının ve videolarının tek bir **gazetede** buluştuğu kişisel bir web uygulaması. Letterloop'a ücretsiz bir alternatif.

- **Giriş:** Google ile ya da e-posta + şifre (onay e-postası beklemeden, Magic Link yok)
- **Gruplar:** Grup kur, davet linkini WhatsApp/Discord/Telegram'da paylaş
- **Sayılar:** 50 hazır Türkçe soruluk havuzdan seç ya da kendi sorunu yaz, son teslim tarihini belirle
- **Yanıtlar:** Metin + fotoğraf + video (tarayıcıda otomatik küçültülür), otomatik kayıt
- **Gazete:** 9 şablon ve bir **Tasarım Stüdyosu** (renkler, yazı tipleri, kâğıt dokusu, fotoğraf filtreleri, düzen…), yazdır / PDF olarak kaydet
- **Bildirimler:** Sayı başlayınca, son 48 saatte (henüz yazmayanlara) ve gazete yayımlanınca e-posta

Tasarım Stüdyosu'nu giriş yapmadan, örnek bir sayıyla `/sablonlar` adresinde deneyebilirsin (orada hiçbir şey kaydedilmez).

---

## Teknolojiler: hepsi ücretsiz katmanda

| Ne | Servis | Ücretsiz kota (yaklaşık) |
|---|---|---|
| Uygulama + barındırma | Next.js 16 + **Vercel Hobby** | 100 GB trafik/ay, günde 1 zamanlanmış iş |
| Veritabanı + giriş | **Supabase Free** | 500 MB veritabanı, 50.000 aktif kullanıcı |
| Fotoğraf ve video | **Cloudinary Free** | Ayda 25 kredi (1 kredi ≈ 1 GB depolama ya da trafik) |
| E-posta | **Gmail SMTP** | Günde ~500 e-posta |

> Ücretsiz kotalar zamanla değişebilir; kurulum sırasında servislerin fiyat sayfalarına bir göz at.
> Vercel Hobby planı kişisel, ticari olmayan projeler içindir; arkadaş grubu için tam uygun.

---

## Kurulum (yaklaşık 30-45 dakika)

Bilgisayarında **Node.js 20.9 veya üstü** (22 önerilir) kurulu olmalı: <https://nodejs.org>

### 1. Projeyi GitHub'a yükle

1. GitHub'da yeni ve **boş** bir repo aç: <https://github.com/new> (ad: `haber-var`, README/gitignore ekleme). Gizli (Private) olabilir.
2. ZIP'i açtığın klasörde terminali aç:

```bash
cd haber-var
git remote add origin https://github.com/KULLANICI_ADIN/haber-var.git
git push -u origin main
npm install
```

### 2. Supabase (veritabanı + giriş)

1. <https://supabase.com> → **New project**. Bölge olarak **Frankfurt (eu-central-1)** seç. Veritabanı şifresini bir yere kaydet.
2. Sol menüden **SQL Editor** → **New query**. Şu iki dosyanın içeriğini **sırayla** yapıştırıp **Run** de:
   1. `supabase/migrations/20261029090000_init.sql` (tablolar, güvenlik kuralları, fonksiyonlar)
   2. `supabase/migrations/20261029090100_question_bank.sql` (50 hazır soru)
3. **Authentication → Sign In / Providers → Email**: **"Confirm email" seçeneğini kapat** ve kaydet. Böylece kayıt olan kişi hemen giriş yapmış olur.
4. **Authentication → URL Configuration**:
   - **Site URL:** `http://localhost:3000` (Vercel'e yükleyince oradaki adresinle değiştir)
   - **Redirect URLs:** `http://localhost:3000/**` ekle (Vercel'den sonra `https://SENIN-PROJEN.vercel.app/**` da ekle)
5. **Project Settings → API Keys** sayfasından şunları kopyala:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **Secret key** → `SUPABASE_SECRET_KEY` (kimseyle paylaşma!)

   Eski projelerde bu anahtarların adı `anon` ve `service_role`'dür; onlar da aynı yerlere yazılabilir.

> **Uyku modu:** Supabase ücretsiz projeleri 7 gün hiç kullanılmazsa duraklatır. Uygulamadaki günlük zamanlanmış iş her gün veritabanına uğradığı için bu normalde olmaz. Olursa Supabase panelinden **Restore** demen yeterli.

### 3. Google ile giriş

1. <https://console.cloud.google.com> → yeni bir proje oluştur.
2. **Google Auth Platform** (eski adıyla *APIs & Services → OAuth consent screen*): "External" seç, uygulama adı `Haber Var`, destek e-postası olarak kendi adresin. Kapsam olarak sadece varsayılan `email` ve `profile` yeterli. Kurulum bitince **Audience → Publish app** ile yayımla; yoksa sadece "test kullanıcısı" olarak eklediğin kişiler giriş yapabilir.
3. **Clients → Create client** (eski adıyla *Credentials → Create credentials → OAuth client ID*) → **Web application**.
   - **Authorized redirect URIs:** `https://PROJE-KODUN.supabase.co/auth/v1/callback`. Tam adres Supabase'de, Google sağlayıcısının ayar sayfasında yazıyor.
4. Çıkan **Client ID** ve **Client secret**'ı Supabase → **Authentication → Sign In / Providers → Google** bölümüne yapıştır ve etkinleştir.

### 4. Cloudinary (fotoğraf ve video)

1. <https://cloudinary.com> üzerinden ücretsiz hesap aç.
2. **Settings → API Keys** sayfasından kopyala:
   - Cloud name → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - API Key → `CLOUDINARY_API_KEY`
   - API Secret → `CLOUDINARY_API_SECRET`

### 5. Gmail (bildirim e-postaları)

1. Google hesabında **2 Adımlı Doğrulama** açık olmalı.
2. <https://myaccount.google.com/apppasswords> → "Haber Var" adında bir uygulama şifresi oluştur.
3. Gmail adresin → `GMAIL_USER`, 16 karakterlik şifre → `GMAIL_APP_PASSWORD`.

**Şifre sıfırlama e-postaları için de** aynı bilgileri Supabase'e gir. Supabase'in kendi e-posta servisi saatte sadece birkaç e-posta gönderebiliyor.
Supabase → **Authentication → Emails → SMTP Settings** → *Enable custom SMTP*:

| Alan | Değer |
|---|---|
| Host | `smtp.gmail.com` |
| Port | `465` |
| Username | Gmail adresin |
| Password | Uygulama şifresi |
| Sender email / name | Gmail adresin / `Haber Var` |

> Gmail yerine Brevo gibi başka bir ücretsiz SMTP servisi kullanmak istersen `.env.example` içindeki `SMTP_HOST`, `SMTP_PORT` ve `EMAIL_FROM` ayarlarına bak.

### 6. Bilgisayarında çalıştır

```bash
cp .env.example .env.local    # sonra .env.local dosyasını doldur
npm run dev
```

<http://localhost:3000> adresini aç, kayıt ol, bir grup kur. 🎉

`CRON_SECRET` için uzun, rastgele bir metin yeter. Üretmek için: `openssl rand -hex 32`

### 7. Vercel'e yükle (internete aç)

1. <https://vercel.com> → GitHub ile giriş → **Add New → Project** → `haber-var` reposunu seç.
2. **Environment Variables** bölümüne `.env.local` içindeki tüm değerleri ekle. `NEXT_PUBLIC_APP_URL` değerini Vercel adresin yap (ör. `https://haber-var.vercel.app`).
3. **Deploy**. Bittikten sonra Vercel adresini Supabase'de **Site URL** ve **Redirect URLs** listesine ekle (2. adım, 4. madde).
4. Zamanlanmış iş `vercel.json` içinde tanımlı: her gün 07:00 UTC'de (Türkiye saatiyle 10:00) süresi dolan sayıları yayımlar ve hatırlatma e-postalarını gönderir. `CRON_SECRET` tanımlı olduğu sürece başka kimse bu işi tetikleyemez.

Bundan sonra GitHub'a her `git push` yaptığında Vercel siteyi otomatik günceller.

---

## Nasıl kullanılır?

1. **Grubu kur** → davet linkini kopyala, WhatsApp'tan paylaş.
2. **Yeni sayı hazırla** → soruları seç (🎲 "Rastgele 5 soru" da var), son teslim tarihini ve gazete şablonunu belirle → **Sayıyı başlat**. Herkese e-posta gider.
3. Herkes yazar. **Yanıtlar süre dolana kadar gizli kalır**; sadece "kim yazdı" görünür.
4. Süre dolunca (ya da yönetici "Şimdi yayımla" deyince) **gazete açılır**. Herkes şablonlar arasında geçiş yapabilir ve gazeteyi yazdırıp PDF olarak saklayabilir.
5. Yönetici gazetenin görünümünü **🎨 Tasarım stüdyosu**ndan istediği zaman değiştirebilir (yayımlandıktan sonra bile).

---

## Yönetici olmak ve ayarlar

Ayrı bir yönetici hesabı ya da paneli yok; yöneticilik **grup bazında**:

- **Grubu kuran kişi otomatik olarak o grubun yöneticisidir.** Normal şekilde kayıt ol, grubu sen kur: yönetici sensin.
- Başkasını da yönetici yapabilirsin: **Grup ayarları → Üyeler → "Yönetici yap"**. Her grubun en az bir yöneticisi kalır.
- Üyeler yanıt yazar ve gazeteyi okur. Ayar düğmelerini sadece yöneticiler görür.

| Nerede | Neler değiştirilir |
|---|---|
| Grup sayfası → **Ayarlar** | Grubun adı ve açıklaması · davet linki (kopyala, WhatsApp/Discord'da paylaş, yenile) · üyeler (yönetici yap, gruptan çıkar) · varsayılan gazete tasarımı · grubu silme |
| Grup sayfası → **Yeni sayı hazırla** | Sorular, son teslim tarihi, şablon |
| Sayı sayfası (taslak) | Soruları düzenle · Gazete tasarımı · Sayıyı başlat · Taslağı sil |
| Sayı sayfası (yanıtlar toplanırken) | Son teslim tarihini değiştir · Şimdi yayımla · Gazete tasarımı · Sayıyı sil |
| Yayımlanmış gazete | Üstteki **Tasarımı düzenle** düğmesi |
| Profil (sağ üstteki adın) | Gazetede görünen adın, e-posta bildirimleri, çıkış |

> Sitenin sahibi olarak her şeye Supabase panelinden de ulaşabilirsin. Örneğin **Table Editor → `group_members`** tablosunda bir kişinin `role` değerini `admin` yaparak onu yönetici yapabilirsin.

---

## Gazete tasarımı

**9 şablon:**

| Şablon | Tarzı |
|---|---|
| 📰 Klasik Gazete | Sütunlar, büyük manşetler ve siyah-beyaz fotoğraflar |
| ✨ Modern Dergi | Kapak fotoğrafı, ferah sayfalar ve büyük alıntılar |
| ✂️ Karalama Defteri | Polaroidler, bant parçaları ve el yazısı notlar |
| 💌 Mektup | Her yanıt bir mektup: pullar, damgalar ve imzalar |
| 📸 Fotoğraf Albümü | Önce fotoğraflar: büyük kareler, kısa notlar |
| ◻️ Sade | Bol beyaz alan, tek sütun, sakin bir okuma |
| 🌙 Gece Baskısı | Koyu zemin, parlak vurgular |
| 📢 Bulvar Gazetesi | Kırmızı manşetler, "SON DAKİKA" bantları, bol heyecan |
| 🕺 Retro Fanzin | 70'ler renkleri, güneş desenleri ve kalın harfler |

**Tasarım Stüdyosu.** Yöneticiler sayının ya da grubun sayfasından açar. Her değişiklik anında önizlenir:

| Bölüm | Seçenekler |
|---|---|
| Başlık ve metinler | Gazetenin adı, slogan, editörün notu ve imzası, kapanış notu |
| Renkler | 15 palet (Terrakota, Gazete kâğıdı, Defter, Mürekkep, Okyanus, Orman, Lavanta, Gün batımı, Pamuk şeker, Kahve, Nane, Retro, Bulvar, Gece, Siyah-beyaz) + istediğin vurgu rengi |
| Yazı tipi | 12 başlık + metin eşleşmesi (Klasik, Zarif, El yazısı, Mektup, Daktilo, Bulvar, Neşeli…), 3 yazı boyutu |
| Sayfa | 8 kâğıt dokusu (Düz, Noktalı, Çizgili, Kareli, Keten, Kraft, Eskimiş, Konfeti), 1-3 sütun, boşluklar, başlık hizası, süsleme miktarı |
| Fotoğraflar | 9 filtre (Siyah-beyaz, Sepya, Vintage, Dramatik…), 6 çerçeve (Polaroid, Posta pulu, Kemer…), boyut, kapak fotoğrafı seçimi |
| Düzen | Soru soru ya da kişi kişi dizilim; yanıt sırası (yazılış, isim, karışık); büyük ilk harf, profil fotoğrafları, soru numaraları, yazanlar listesi, tarih ve istatistikler aç/kapat |

- **🎲 Bana sürpriz yap** rastgele bir görünüm dener; **Görünümü sıfırla** yazdığın metinlere dokunmaz.
- Önizlemeyi bilgisayar ya da telefon boyutunda görebilirsin.
- Bir sayıyı tasarlarken **"Grubun varsayılanı da olsun"** dersen sonraki sayılar da bu görünümle başlar. Grubun varsayılanını doğrudan **Grup ayarları → Gazete tasarımı**'ndan da ayarlayabilirsin.
- Ayarlardaki **"Şablonun"** seçeneği, seçili şablonun kendi tercihini kullanır. Okuyucu gazetenin üstündeki menüden başka şablona geçince görünüm o şablona uyar.

Yeni bir palet, yazı tipi ya da kâğıt dokusu eklemek istersen: `src/lib/design-options.ts`.

---

## Video ve fotoğraf stratejisi (kotayı aşmamak için)

Ham video hiçbir zaman sunucuya ulaşmaz. Her şey önce **kullanıcının kendi cihazında** küçültülür:

| Kural | Değer |
|---|---|
| Fotoğraf | En fazla 1600 px, WebP (Safari'de JPEG), ~100-300 KB. Konum gibi EXIF bilgileri silinir. |
| Video | 720p, H.264 MP4, ~2 Mbps, 60 fps ise 30 fps'e indirilir. 60 sn'den uzunsa ilk 60 sn alınır. |
| Yanıt başına | En fazla 4 fotoğraf + 1 video |
| Sayı başına | Kişi başı en fazla 2 video |
| Sert sınırlar | Fotoğraf 3 MB, video 30 MB (veritabanı da kontrol eder) |
| Kota bekçisi | Cloudinary aylık kredisinin %85'i dolunca yeni video kabul edilmez (fotoğraflar devam eder) |

- Sıkıştırma tarayıcının WebCodecs özelliğiyle, mümkünse donanım hızlandırmalı yapılır ([mediabunny](https://mediabunny.dev)). Bu sırada ekranda bir ilerleme çubuğu görünür.
- Dosyalar Vercel'den geçmeden **doğrudan Cloudinary'ye** yüklenir. Sunucu sadece imzalı bir izin verir, sonra yüklemenin gerçekten Cloudinary'den geldiğini doğrular.
- Gazetede videolar kapak görseliyle gelir ve **sadece oynat'a basılınca** indirilir (`preload="none"`). Gazeteyi açan herkes trafik kotasını harcamaz.
- Silinen sayıların ve grupların dosyaları Cloudinary'den de silinir.

**Kaba hesap:** 10 kişilik bir grup, ayda bir sayı, herkes 1 video + 3 fotoğraf eklerse ayda ~150 MB depolama eklenir. Herkes her videoyu izlese bile ayda ~1,5 GB trafik olur. Bu, 25 kredilik kotanın çok altında.

Sınırları değiştirmek istersen: `src/lib/media/limits.ts` ve veritabanındaki `check_media_limits()` fonksiyonu.

---

## Güvenlik modeli

- Tüm tablolarda **satır bazlı güvenlik (RLS)** açık. Kullanıcı sadece üyesi olduğu grupları görebilir.
- Başkalarının yanıtları, sayı yayımlanana kadar **veritabanı seviyesinde** gizli; uygulamada bir hata olsa bile sızmaz.
- E-posta adresleri grup arkadaşlarına gösterilmez; sadece sunucu bildirim göndermek için okuyabilir.
- Gizli anahtarlar (`SUPABASE_SECRET_KEY`, `CLOUDINARY_API_SECRET`, `GMAIL_APP_PASSWORD`) sadece sunucuda kullanılır; tarayıcıya hiç gitmez.
- Davet linkleri tahmin edilemeyen 16 karakterlik kodlardır. Grup ayarlarından tek tıkla yenilenebilir (eski link çalışmaz olur).

---

## Proje yapısı

```
haber-var/
├── supabase/migrations/      Veritabanı şeması, güvenlik kuralları ve soru havuzu (SQL)
├── src/
│   ├── app/
│   │   ├── page.tsx                 Açılış sayfası
│   │   ├── (auth)/                  Giriş, kayıt, şifre sıfırlama
│   │   ├── (app)/gruplar/           Grup listesi, grup sayfası, ayarlar, yeni sayı, varsayılan tasarım
│   │   ├── (app)/sayi/[id]/         Yanıt yazma / gazete görünümü / taslak düzenleme / tasarım stüdyosu
│   │   ├── (app)/profil/            Profil ve bildirim ayarları
│   │   ├── davet/[token]/           Davet linki sayfası
│   │   ├── sablonlar/               Herkese açık deneme stüdyosu (giriş gerektirmez)
│   │   ├── auth/callback/           Google girişi ve şifre sıfırlama dönüşü
│   │   └── api/cron/                Günlük zamanlanmış iş
│   ├── actions/                     Sunucu işlemleri (form gönderimleri)
│   ├── components/
│   │   ├── ui/                      Buton, kart, avatar gibi temel parçalar
│   │   ├── newspaper/               Gazete: 9 şablon (templates/), ortak parçalar, yazı tipleri
│   │   ├── design/                  Tasarım stüdyosu
│   │   ├── answer/                  Yanıt formu ve medya yükleme
│   │   ├── issues/  groups/  auth/
│   ├── lib/
│   │   ├── media/                   Fotoğraf/video sıkıştırma, yükleme, sınırlar
│   │   ├── email/                   E-posta gönderimi ve şablonları
│   │   ├── supabase/                Supabase istemcileri
│   │   ├── data/                    Veritabanı sorguları
│   │   ├── design-options.ts        Paletler, yazı tipleri, kâğıtlar, filtreler, çerçeveler, şablon varsayılanları
│   │   ├── design.ts                Tasarım ayarlarının doğrulanması ve CSS değişkenlerine çevrilmesi
│   │   └── notifications.ts         Hangi e-posta kime, ne zaman
│   └── proxy.ts                     Oturum yenileme ve korumalı sayfalar
├── vercel.json                      Günlük zamanlanmış iş
└── .env.example                     Gerekli ayarların listesi
```

Faydalı komutlar:

```bash
npm run dev         # geliştirme sunucusu
npm run lint        # kod kontrolü
npm run typecheck   # TypeScript kontrolü
npm run build       # üretim derlemesi
```

---

## Sorun giderme

| Sorun | Çözüm |
|---|---|
| "… ortam değişkeni eksik" hatası | `.env.local` (ya da Vercel'deki Environment Variables) eksik. `.env.example` ile karşılaştır. Değişiklikten sonra sunucuyu yeniden başlat. |
| Google ile girişten sonra "Giriş linki geçersiz" | Supabase → URL Configuration → Redirect URLs listesinde sitenin adresi (`/**` ile) olmalı. |
| Google butonu hata veriyor | Supabase'de Google sağlayıcısı açık mı, Client ID/Secret doğru mu, Google'daki redirect URI Supabase'in verdiğiyle aynı mı? |
| Kayıttan sonra "e-postanı onayla" yazıyor | Supabase → Authentication → Email → "Confirm email" kapalı olmalı. |
| E-postalar gitmiyor | Uygulama şifresini boşluksuz gir; spam klasörüne bak; Vercel → Logs'ta `[e-posta]` satırlarını kontrol et. |
| Video yüklenmiyor | Video 60 sn'den uzunsa otomatik kırpılır. Windows'ta bazı iPhone (HEVC) videoları Chrome'da açılamayabilir; telefondan yüklemek ya da Safari kullanmak çözer. |
| Telefonla bilgisayardaki geliştirme sunucusuna bağlanınca sayfa donuk | `next.config.ts` içine `allowedDevOrigins: ["192.168.x.x"]` ekle (yerel IP adresin). |
| Supabase projesi duraklatılmış | Panelden **Restore** de. Zamanlanmış iş çalıştığı sürece tekrar olmaz. |
| "Ayarlar" ya da "Tasarımı düzenle" düğmesi görünmüyor | Bu düğmeleri sadece grubun yöneticileri görür. Grubun bir yöneticisi seni **Grup ayarları → Üyeler**'den yönetici yapabilir. |

---

## Sırada ne olabilir?

- Yanıtlara emoji tepkileri ve yorumlar
- Gazete yayımlanınca otomatik PDF arşivi
- Sayıları otomatik başlatan tekrar planı (ör. her ayın 1'i)
- İngilizce arayüz

Sevgiyle, uzaktaki dostlar için. 💌
