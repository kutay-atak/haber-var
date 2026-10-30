# 📰 Haber Var

Uzaktaki arkadaşlarınla periyodik olarak aynı soruları yanıtladığın, süre dolunca herkesin yazılarının, fotoğraflarının ve videolarının tek bir **gazetede** buluştuğu kişisel bir web uygulaması. Letterloop'a ücretsiz bir alternatif.

- **Giriş:** Google ile ya da e-posta + şifre (onay e-postası beklemeden, Magic Link yok)
- **Gruplar:** Grup kur, davet linkini WhatsApp/Discord/Telegram'da paylaş
- **Sayılar:** 110 hazır soruluk havuzdan seç (yazılı sorular, anketler ve "Kim daha çok?" soruları) ya da kendi sorunu yaz, son teslim tarihini belirle
- **Editörler:** Yöneticinin editör yaptığı üyeler sıradaki sayı için soru önerir
- **Otomatik sayılar:** Her hafta, iki haftada bir ya da her ay kendiliğinden başlayan sayılar
- **Yanıtlar:** Metin + fotoğraf + video (tarayıcıda otomatik küçültülür) + isteğe bağlı sesli not, otomatik kayıt
- **Oylar:** Anketler ve "Kim daha çok?" soruları; sonuçlar gazetede grafiklerle
- **Gazete:** 9 şablon ve bir **Tasarım Stüdyosu** (renkler, yazı tipleri, kâğıt dokusu, fotoğraf filtreleri, düzen…), yazdır / PDF olarak kaydet
- **Tepkiler ve yorumlar:** Yayımlanan gazetedeki her yanıtın altına emoji ve yorum
- **Bildirimler:** Sayı başlayınca, son 48 saatte (henüz katılmayanlara) ve gazete yayımlanınca e-posta ve telefon bildirimi
- **Telefonda:** Mağaza gerekmeden ana ekrana eklenir, uygulama gibi açılır (Android'de tek dokunuş, iPhone'da Safari → Paylaş → Ana Ekrana Ekle)
- **Dil:** Türkçe ve İngilizce (üst menüdeki TR | EN düğmesi; e-postalar herkese kendi seçtiği dilde gider)

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
2. Sol menüden **SQL Editor** → **New query**. Şu beş dosyanın içeriğini **sırayla**, her biri için ayrı bir sorguya yapıştırıp **Run** de:
   1. `supabase/migrations/20261029090000_init.sql` (tablolar, güvenlik kuralları, fonksiyonlar)
   2. `supabase/migrations/20261029090100_question_bank.sql` (50 hazır soru)
   3. `supabase/migrations/20261101090000_editors_polls_social.sql` (editörler, anketler, sesli notlar, tepkiler, yorumlar, otomatik sayılar ve 14 yeni hazır soru)
   4. `supabase/migrations/20261105090000_push.sql` (telefon bildirimleri)
   5. `supabase/migrations/20261110090000_more_questions.sql` (46 yeni hazır soru)

   Her dosya **bir kez** çalıştırılır. Bir dosyayı yanlışlıkla ikinci kez çalıştırırsan "already exists" hatası alırsın. Bu, dosyanın zaten uygulandığı anlamına gelir; hiçbir şey bozulmaz.
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

### Siteyi daha önce kurduysan: güncellemeler

Yeni özellikler veritabanında yeni tablolar ister. Henüz çalıştırmadığın dosyaları sırayla çalıştır: Supabase → **SQL Editor** → **New query** → dosyanın **tüm** içeriğini yapıştır → **Run**. "Success. No rows returned" yazısını görmelisin.

| Dosya | Ne getirir | Ne zaman |
|---|---|---|
| `20261101090000_editors_polls_social.sql` | Editörler, anketler, sesli notlar, tepkiler, yorumlar, otomatik sayılar | Yeni kodu yayına almadan **önce** (yoksa bazı sayfalar hata verir) |
| `20261105090000_push.sql` | Telefon bildirimleri | İstediğin zaman. Çalıştırılana kadar site sorunsuz çalışır; sadece bildirim düğmeleri görünmez. Ek bir ayar gerekmez: bildirim anahtarları ilk kullanımda kendiliğinden oluşur. |
| `20261110090000_more_questions.sql` | Soru havuzuna 46 yeni soru (39 yazılı, 7 "Kim daha çok?") | İstediğin zaman. Daha önce çalıştırdıysan sonradan eklenen sorular için bir kez daha çalıştır; aynı soru iki kez eklenmez. |

Her dosya tek parça hâlinde çalışır: bir hata olursa hiçbir değişiklik uygulanmaz. Hata mesajını okuyup düzelttikten sonra tekrar çalıştırabilirsin.

---

## Nasıl kullanılır?

1. **Grubu kur** → davet linkini kopyala, WhatsApp'tan paylaş.
2. İstersen birkaç arkadaşını **editör** yap (**Grup ayarları → Üyeler**). Editörler grup sayfasındaki **"Sıradaki sayı için sorular"** kartından soru önerir: havuzdan seçerek ya da kendileri yazarak.
3. **Yeni sayı hazırla** → editörlerin önerdiği sorular otomatik olarak eklenir. Kalanları havuzdan seç (🎲 "Rastgele 5 soru" da var) ya da kendin yaz. Her soru için tür seçebilirsin:
   - ✍️ **Yazılı:** metin, fotoğraf, video ve isteğe bağlı sesli notla yanıtlanır.
   - 📊 **Anket:** 2-6 seçenek, tek dokunuşla oy.
   - 🏆 **Kim daha çok?:** herkes gruptan birine oy verir.

   Son teslim tarihini ve gazete şablonunu belirle → **Sayıyı başlat**. Herkese e-posta gider.
4. Herkes yazar ve oy verir. **Yanıtlar ve oylar süre dolana kadar gizli kalır**; sadece "kim katıldı" görünür. Yazmak yerine değil, yazının yanında **🎙️ Sesli not ekle** düğmesiyle 2 dakikaya kadar ses kaydı da eklenebilir.
5. Süre dolunca (ya da yönetici "Şimdi yayımla" deyince) **gazete açılır**. Anket sonuçları halka grafik ve çubuklarla, "Kim daha çok?" sonuçları kürsü ve madalyalarla gösterilir. Herkes şablonlar arasında geçiş yapabilir ve gazeteyi yazdırıp PDF olarak saklayabilir. PDF'te her soru tek sayfada kalır; bir sayfadan uzun soru bir sonraki sayfada devam eder.
6. Gazetedeki her yanıtın altına **emoji tepkisi** (❤️ 😂 😮 😢 👏 🔥) bırakılabilir ve **yorum** yazılabilir.
7. Yönetici gazetenin görünümünü **🎨 Tasarım stüdyosu**ndan istediği zaman değiştirebilir (yayımlandıktan sonra bile).
8. Her seferinde elle uğraşmak istemiyorsan **Grup ayarları → 🔁 Otomatik sayılar** bölümünü aç. Sıklığı (her hafta, iki haftada bir, her ay), günü, sayının kaç gün açık kalacağını ve soru sayısını seç. Sayı o sabah Türkiye saatiyle 10:00 civarında kendiliğinden başlar ve son gün 20:00'de kapanır. Sorular önce editörlerin sırasından, kalanı havuzdan rastgele gelir. O sırada başka bir sayı hâlâ açıksa yeni sayı onun bitmesini bekler.
9. **📱 Telefona ekle:** Telefonda Gruplar sayfasının üstünde bir kart çıkar (ya da **Profil → Ana ekrana ekle**).
   - **Android:** **Uygulamayı yükle**'ye dokunmak yeter.
   - **iPhone:** Safari'de **Paylaş** → **Ana Ekrana Ekle**.

   Sonra Haber Var ana ekrandaki simgesinden uygulama gibi açılır.
10. **🔔 Bildirimler:** Gruplar sayfasındaki karttan ya da **Profil → Bu cihazda bildirimler**'den **Bildirimleri aç**. Yeni sayıda, son gün hatırlatmasında ve gazete çıkınca telefona bildirim gelir. **Deneme bildirimi gönder** ile hemen deneyebilirsin. iPhone'da bunun için Haber Var'ı önce ana ekrana ekleyip oradan açmak gerekir (iOS 16.4 ve sonrası).

---

## Yönetici olmak ve ayarlar

Ayrı bir yönetici hesabı ya da paneli yok; yöneticilik **grup bazında**:

- **Grubu kuran kişi otomatik olarak o grubun yöneticisidir.** Normal şekilde kayıt ol, grubu sen kur: yönetici sensin.
- Herkesin rolünü **Grup ayarları → Üyeler** listesindeki açılır menüden seçersin: **Üye**, **Editör** ya da **Yönetici**. Her grubun en az bir yöneticisi kalır.
- **Üyeler** yanıt yazar, oy verir ve gazeteyi okur.
- **Editörler** bunlara ek olarak sıradaki sayı için soru önerir. Sayıyı yine yöneticiler başlatır.
- Ayar düğmelerini sadece yöneticiler görür.

| Nerede | Neler değiştirilir |
|---|---|
| Grup sayfası → **Ayarlar** | Grubun adı ve açıklaması · davet linki (kopyala, WhatsApp/Discord'da paylaş, yenile) · üyeler (rol seç, gruptan çıkar) · otomatik sayılar · varsayılan gazete tasarımı · grubu silme |
| Grup sayfası → **Sıradaki sayı için sorular** | Editörler ve yöneticiler soru önerir; öneriyi ekleyen kişi ya da bir yönetici çıkarabilir |
| Grup sayfası → **Yeni sayı hazırla** | Sorular ve türleri (yazılı, anket, "Kim daha çok?"), son teslim tarihi, şablon |
| Sayı sayfası (taslak) | Soruları düzenle · Gazete tasarımı · Sayıyı başlat · Taslağı sil |
| Sayı sayfası (yanıtlar toplanırken) | Son teslim tarihini değiştir · Şimdi yayımla · Gazete tasarımı · Sayıyı sil |
| Yayımlanmış gazete | Üstteki **Tasarımı düzenle** düğmesi · uygunsuz yorumları silme (yöneticiler her yorumu silebilir) |
| Profil (sağ üstteki adın) | Gazetede görünen adın, e-posta bildirimleri, çıkış |

> Sitenin sahibi olarak her şeye Supabase panelinden de ulaşabilirsin. Örneğin **Table Editor → `group_members`** tablosunda bir kişinin `role` değerini `admin` (yönetici) ya da `editor` (editör) yapabilirsin.

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
| Başlık ve metinler | Gazetenin adı (şablonun yazısıyla ya da eski gazete yazısıyla), slogan, editörün notu ve imzası, kapanış notu |
| Renkler | 15 palet (Terrakota, Gazete kâğıdı, Defter, Mürekkep, Okyanus, Orman, Lavanta, Gün batımı, Pamuk şeker, Kahve, Nane, Retro, Bulvar, Gece, Siyah-beyaz) + istediğin vurgu rengi |
| Yazı tipi | 12 başlık + metin eşleşmesi (Klasik, Zarif, El yazısı, Mektup, Daktilo, Bulvar, Neşeli…), 3 yazı boyutu |
| Sayfa | 8 kâğıt dokusu (Düz, Noktalı, Çizgili, Kareli, Keten, Kraft, Eskimiş, Konfeti), 1-3 sütun, boşluklar, başlık hizası, süsleme miktarı |
| Fotoğraflar | 9 filtre (Siyah-beyaz, Sepya, Vintage, Dramatik…), 6 çerçeve (Polaroid, Posta pulu, Kemer…), boyut, kapak fotoğrafı seçimi |
| Düzen | **Sayfa düzeni:** alt alta ya da **gazete sayfası gibi** (kısa sorular yan yana, uzunlar daha geniş; telefonda yine alt alta). Klasik şablonda bu seçenek gerçek bir gazetenin birinci sayfasını kurar: en üstte içerideki haberlerin tanıtımları, ortada fotoğraflı manşet, iki yanda dar sütunlarda haberler, iki yana yaslı ve hecelenmiş metin. Baskıda yan haberler gazete adının altında kalır, manşet kendi sayfasına geçer. Soru soru ya da kişi kişi dizilim; yanıt sırası (yazılış, isim, karışık); büyük ilk harf, profil fotoğrafları, soru numaraları, yazanlar listesi, tarih ve istatistikler aç/kapat |

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
| Sesli not | En fazla 2 dakika, ~64 kbps sıkıştırılmış ses (2 dakika ≈ 1 MB) |
| Yanıt başına | En fazla 4 fotoğraf + 1 video + 1 sesli not |
| Sayı başına | Kişi başı en fazla 2 video |
| Sert sınırlar | Fotoğraf 3 MB, video 30 MB, sesli not 10 MB (veritabanı da kontrol eder) |
| Kota bekçisi | Cloudinary aylık kredisinin %85'i dolunca yeni video kabul edilmez (fotoğraflar devam eder) |

- Sıkıştırma tarayıcının WebCodecs özelliğiyle, mümkünse donanım hızlandırmalı yapılır ([mediabunny](https://mediabunny.dev)). Bu sırada ekranda bir ilerleme çubuğu görünür.
- Dosyalar Vercel'den geçmeden **doğrudan Cloudinary'ye** yüklenir. Sunucu sadece imzalı bir izin verir, sonra yüklemenin gerçekten Cloudinary'den geldiğini doğrular.
- Gazetede videolar kapak görseliyle, sesli notlar dalga deseniyle gelir; ikisi de **sadece oynat'a basılınca** indirilir (`preload="none"`). Gazeteyi açan herkes trafik kotasını harcamaz. Yazdırılan gazetede videolar ve sesli notlar için bir QR kod çıkar.
- Silinen sayıların ve grupların dosyaları Cloudinary'den de silinir.

**Kaba hesap:** 10 kişilik bir grup, ayda bir sayı, herkes 1 video + 3 fotoğraf eklerse ayda ~150 MB depolama eklenir. Herkes her videoyu izlese bile ayda ~1,5 GB trafik olur. Bu, 25 kredilik kotanın çok altında.

Sınırları değiştirmek istersen: `src/lib/media/limits.ts` ve veritabanındaki `check_media_limits()` fonksiyonu.

---

## Güvenlik modeli

- Tüm tablolarda **satır bazlı güvenlik (RLS)** açık. Kullanıcı sadece üyesi olduğu grupları görebilir.
- Başkalarının yanıtları ve oyları, sayı yayımlanana kadar **veritabanı seviyesinde** gizli; uygulamada bir hata olsa bile sızmaz.
- **"Kim daha çok?" oyları yayından sonra da gizli kalır:** veritabanı sadece kimin kaç oy aldığını verir, kimin kime oy verdiğini hiç kimseye vermez. Anketlerde ise kimin neyi seçtiği gazetede görünür (oy ekranında bu yazar).
- Tepkiler ve yorumlar sadece yayımlanmış gazetede ve sadece grup üyelerine açıktır.
- Telefon bildirimleri cihaz bazındadır: çıkış yapınca o cihaz silinir. Sunucu sadece tarayıcıların kendi bildirim servislerine (Google, Apple, Mozilla, Microsoft) gönderir. Bildirimde sadece grubun adı ve sayı bilgisi yazar.
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
│   │   ├── answer/                  Yanıt formu, medya yükleme, ses kaydı ve oylama
│   │   ├── questions/               Soru havuzu ve soru türleri (yazılı, anket, "Kim daha çok?")
│   │   ├── pwa/                     Ana ekrana ekleme ve telefon bildirimleri (düğmeler, ayarlar)
│   │   ├── issues/  groups/  auth/
│   ├── lib/
│   │   ├── media/                   Fotoğraf/video sıkıştırma, yükleme, sınırlar
│   │   ├── email/                   E-posta gönderimi ve şablonları
│   │   ├── supabase/                Supabase istemcileri
│   │   ├── data/                    Veritabanı sorguları
│   │   ├── design-options.ts        Paletler, yazı tipleri, kâğıtlar, filtreler, çerçeveler, şablon varsayılanları
│   │   ├── design.ts                Tasarım ayarlarının doğrulanması ve CSS değişkenlerine çevrilmesi
│   │   ├── schedules.ts             Otomatik sayıların tarih hesapları (schedule-runner.ts sayıyı açar)
│   │   ├── push.ts                  Telefon bildirimi gönderimi (Web Push)
│   │   └── notifications.ts         Hangi e-posta ve bildirim kime, ne zaman
│   └── proxy.ts                     Oturum yenileme ve korumalı sayfalar
├── public/sw.js                     Service worker: bildirimleri gösterir, bağlantı yoksa offline.html
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
| "Sıradaki sayı için sorular" kartı görünmüyor | Kartı sadece editörler ve yöneticiler görür. Bir yönetici rolünü **Editör** yapmalı. |
| SQL Editor'da "already exists" hatası | O dosya zaten çalıştırılmış; tekrar çalıştırmana gerek yok. |
| Yeni sürümden sonra sayfalar hata veriyor | 2. sürümün SQL dosyası (`20261101090000_editors_polls_social.sql`) çalıştırılmamış olabilir. Yukarıdaki "2. sürüme güncelleme" adımlarına bak. |
| Sesli not kaydedilmiyor | Tarayıcı mikrofon izni ister; reddettiysen adres çubuğundaki kilit simgesinden izin ver. Mikrofon yoksa **Ses dosyası seç** ile telefonda kaydettiğin bir dosyayı yükleyebilirsin. |
| Otomatik sayı başlamadı | Zamanlanmış iş günde bir kez (Türkiye saatiyle 10:00 civarı) çalışır. Başka bir sayı hâlâ açıksa yeni sayı onun bitmesini bekler ve ertesi sabah tekrar denenir. |
| Telefonda "Uygulamayı yükle" düğmesi yok | Android'de tarayıcının ⋮ menüsünden **Uygulamayı yükle** ya da **Ana ekrana ekle**. iPhone'da Safari'de **Paylaş → Ana Ekrana Ekle**. WhatsApp ya da Instagram'ın içinde açılan sayfada olmaz; linki Safari ya da Chrome'da aç. |
| Profilde bildirim bölümü yok | `20261105090000_push.sql` çalıştırılmamış. Yukarıdaki "güncellemeler" adımlarına bak. |
| iPhone'da "önce ana ekrana ekle" yazıyor | iPhone bildirimleri sadece ana ekrana eklenen sitede çalışır (iOS 16.4 ve sonrası). Ana ekrandaki Haber Var simgesinden aç, sonra bildirimleri aç. |
| Bildirim gelmiyor | **Profil → Deneme bildirimi gönder**'i dene. Telefonun ayarlarında Haber Var (ya da tarayıcı) için bildirimlere izin verildiğinden ve pil tasarrufunun engellemediğinden emin ol. Vercel → Logs'ta `[bildirim]` satırlarına bak. |
| iPhone'da ana ekrandaki uygulama yeniden giriş istiyor | Normal: ana ekrana eklenen uygulama Safari'den ayrı oturum tutar, bir kez giriş yapman yeter. Orada Google ile giriş tamamlanmazsa Safari'de **Şifremi unuttum** ile bir şifre belirle (linki de Safari'de aç), sonra uygulamada e-posta ve şifrenle gir. |

---

## Sırada ne olabilir?

- Gazete yayımlanınca otomatik PDF arşivi

Sevgiyle, uzaktaki dostlar için. 💌
