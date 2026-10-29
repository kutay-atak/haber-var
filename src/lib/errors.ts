// Hata mesajlarını kullanıcıya gösterilebilir Türkçe metne çevirir.

export const GENERIC_ERROR = "Bir şeyler ters gitti. Birazdan tekrar dener misin?";

interface DbError {
  code?: string;
  message?: string;
}

/** Veritabanı fonksiyonlarımız Türkçe mesajla hata fırlatır (kod P0001); onları aynen göster. */
export function dbErrorMessage(error: DbError | null | undefined): string {
  if (!error) return GENERIC_ERROR;
  if (error.code === "P0001" && error.message) return error.message;
  if (error.code === "23505") return "Bu kayıt zaten var.";
  if (error.code === "42501") return "Bunu yapmaya yetkin yok.";
  console.error("[veritabanı]", error);
  return GENERIC_ERROR;
}

const AUTH_MESSAGES: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-posta ya da şifre hatalı."],
  [/user already registered|already been registered/i, "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene."],
  [/password should be at least|weak password/i, "Şifre çok kısa ya da kolay tahmin edilebilir."],
  [/email not confirmed/i, "E-posta adresin henüz onaylanmamış. (Supabase ayarlarında \"Confirm email\" seçeneğini kapatmayı unutma.)"],
  [/rate limit|too many requests/i, "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene."],
  [/invalid email|unable to validate email/i, "Geçerli bir e-posta adresi gir."],
  [/same password|different from the old/i, "Yeni şifren eskisiyle aynı olamaz."],
  [/fetch failed|network/i, "Sunucuya ulaşılamadı. İnternet bağlantını kontrol et."],
];

export function authErrorMessage(message: string | undefined): string {
  if (!message) return GENERIC_ERROR;
  for (const [pattern, text] of AUTH_MESSAGES) if (pattern.test(message)) return text;
  console.error("[giriş]", message);
  return GENERIC_ERROR;
}
