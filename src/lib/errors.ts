// Hata mesajlarını kullanıcıya gösterilebilir metne çevirir.
import { translator, type T } from "@/lib/i18n";

const TR = translator("tr");

export function genericError(t: T = TR): string {
  return t("Bir şeyler ters gitti. Birazdan tekrar dener misin?", "Something went wrong. Could you try again in a moment?");
}

interface DbError {
  code?: string;
  message?: string;
}

/** Veritabanı fonksiyonlarımızın fırlattığı Türkçe mesajların İngilizceleri (bkz. supabase/migrations). */
const DB_MESSAGES_EN: Record<string, string> = {
  "Başlamış bir sayının soruları değiştirilemez.": "Questions can't be changed once an issue has started.",
  "Bir sayıda 1 ile 10 arasında soru olmalı.": "An issue needs between 1 and 10 questions.",
  "Bir sayıda en fazla 2 video paylaşabilirsin.": "You can share at most 2 videos per issue.",
  "Bir yanıta en fazla 1 video eklenebilir.": "An answer can have at most 1 video.",
  "Bir yanıta en fazla 4 fotoğraf eklenebilir.": "An answer can have at most 4 photos.",
  "Bu davet linki geçersiz ya da süresi dolmuş.": "This invite link is invalid or has expired.",
  "Bu grup dolu (en fazla 50 kişi).": "This group is full (50 people at most).",
  "Bu grupta devam eden bir sayı var. Önce onun bitmesini bekle ya da erken yayımla.":
    "This group already has a running issue. Wait for it to finish or publish it early.",
  "Bu sayı zaten başlamış.": "This issue has already started.",
  "Bunu sadece grup yöneticileri yapabilir.": "Only group admins can do this.",
  "Fotoğraf çok büyük (en fazla 3 MB).": "The photo is too large (3 MB at most).",
  "Sadece devam eden bir sayı yayımlanabilir.": "Only a running issue can be published.",
  "Sayı bulunamadı.": "Issue not found.",
  "Son teslim tarihi en az 1 saat sonra olmalı.": "The deadline must be at least 1 hour from now.",
  "Soru bulunamadı.": "Question not found.",
  "Video çok büyük (en fazla 30 MB).": "The video is too large (30 MB at most).",
  "Yanıt bulunamadı.": "Answer not found.",
  "Önce giriş yapmalısın.": "You need to log in first.",
  "Geçersiz oy.": "Invalid vote.",
  "Bu soru oylama sorusu değil.": "This question isn't a vote.",
  "Sıradaki sayı için en fazla 20 soru önerilebilir.": "You can suggest at most 20 questions for the next issue.",
  "Ses kaydı çok büyük (en fazla 10 MB).": "The recording is too large (10 MB at most).",
  "Bir yanıta en fazla 1 sesli not eklenebilir.": "An answer can have at most 1 voice note.",
};

/** Veritabanı fonksiyonlarımız Türkçe mesajla hata fırlatır (kod P0001); onları seçili dilde göster. */
export function dbErrorMessage(error: DbError | null | undefined, t: T = TR): string {
  if (!error) return genericError(t);
  if (error.code === "P0001" && error.message) return t(error.message, DB_MESSAGES_EN[error.message] ?? error.message);
  if (error.code === "23505") return t("Bu kayıt zaten var.", "This already exists.");
  if (error.code === "42501") return t("Bunu yapmaya yetkin yok.", "You don't have permission to do this.");
  console.error("[veritabanı]", error);
  return genericError(t);
}

const AUTH_MESSAGES: Array<[RegExp, string, string]> = [
  [/invalid login credentials/i, "E-posta ya da şifre hatalı.", "Wrong email or password."],
  [
    /user already registered|already been registered/i,
    "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
    "An account with this email already exists. Try logging in.",
  ],
  [
    /password should be at least|weak password/i,
    "Şifre çok kısa ya da kolay tahmin edilebilir.",
    "The password is too short or too easy to guess.",
  ],
  [
    /email not confirmed/i,
    "E-posta adresin henüz onaylanmamış. (Supabase ayarlarında \"Confirm email\" seçeneğini kapatmayı unutma.)",
    "Your email address isn't confirmed yet. (Remember to turn off \"Confirm email\" in the Supabase settings.)",
  ],
  [
    /rate limit|too many requests/i,
    "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.",
    "Too many attempts. Try again in a few minutes.",
  ],
  [/invalid email|unable to validate email/i, "Geçerli bir e-posta adresi gir.", "Enter a valid email address."],
  [/same password|different from the old/i, "Yeni şifren eskisiyle aynı olamaz.", "Your new password can't be the same as the old one."],
  [
    /fetch failed|network/i,
    "Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.",
    "Couldn't reach the server. Check your internet connection.",
  ],
];

export function authErrorMessage(message: string | undefined, t: T = TR): string {
  if (!message) return genericError(t);
  for (const [pattern, tr, en] of AUTH_MESSAGES) if (pattern.test(message)) return t(tr, en);
  console.error("[giriş]", message);
  return genericError(t);
}
