// Ücretsiz Cloudinary kotası (ayda 25 kredi ≈ 25 GB depolama + trafik) aşılmasın diye
// medya kuralları. Sayı sınırlarını değiştirirsen veritabanındaki
// check_media_limits() fonksiyonunu da güncelle (supabase/migrations/..._init.sql).

export const MEDIA_LIMITS = {
  imagesPerAnswer: 4,
  videosPerAnswer: 1,
  videosPerIssue: 2,

  /** Sıkıştırılmış fotoğraf için sert sınır (veritabanı da kontrol eder). */
  imageMaxBytes: 3 * 1024 * 1024,
  /** Fotoğrafın uzun kenarı en fazla bu kadar piksel olur. */
  imageMaxSide: 1600,

  /** Videonun ilk 60 saniyesi kullanılır. */
  videoMaxSeconds: 60,
  /** 720p: kısa kenar 720, uzun kenar 1280 pikseli geçmez. */
  videoMaxShortSide: 720,
  videoMaxLongSide: 1280,
  /** ~2 Mbps → 60 saniyelik video yaklaşık 15 MB. */
  videoBitrate: 2_000_000,
  /** Hâlâ büyükse daha düşük kaliteyle bir kez daha denenir. */
  videoFallbackBitrate: 1_100_000,
  /** Sıkıştırılmış video için hedef üst sınır. */
  videoTargetBytes: 25 * 1024 * 1024,
  /** Sunucu ve veritabanının kabul ettiği sert sınır. */
  videoMaxBytes: 30 * 1024 * 1024,
  /** Bu kadar küçük ve 720p'den büyük olmayan videolar hiç dönüştürülmeden yüklenir. */
  videoSkipCompressionBytes: 8 * 1024 * 1024,

  /** Cloudinary aylık kredinin bu yüzdesi dolunca yeni video kabul edilmez. */
  videoQuotaCutoffPercent: 85,
} as const;

/** Cloudinary'de tüm dosyalar bu klasörün altında: haber-var/<grup>/<sayı>/<kişi>/<dosya> */
export const MEDIA_ROOT = "haber-var";

export function mediaPrefix(groupId: string, issueId?: string, userId?: string): string {
  return [MEDIA_ROOT, groupId, issueId, userId].filter(Boolean).join("/") + "/";
}
