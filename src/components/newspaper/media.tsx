import { Play } from "lucide-react";
import { translator, type Locale } from "@/lib/i18n";
import type { NewsMedia } from "@/lib/newspaper";
import { cn } from "@/lib/utils";

export function NewsImage({
  media,
  alt,
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
}: {
  media: NewsMedia;
  alt: string;
  sizes?: string;
  className?: string;
}) {
  if (!media.src) return null;
  return (
    <img
      src={media.src}
      srcSet={media.srcSet}
      sizes={media.srcSet ? sizes : undefined}
      alt={alt}
      width={media.width ?? undefined}
      height={media.height ?? undefined}
      loading="lazy"
      decoding="async"
      className={cn("block h-auto w-full", className)}
    />
  );
}

/**
 * Video kapak görseliyle gelir ve sadece oynatılınca indirilir (preload="none"):
 * böylece gazeteyi açan herkes Cloudinary trafik kotasını harcamaz.
 * Basılı sayfada video yerine kapak + QR kodu çıkar.
 */
export function NewsVideo({ media, className, locale = "tr" }: { media: NewsMedia; className?: string; locale?: Locale }) {
  const t = translator(locale);
  return (
    <div className={className}>
      {media.src ? (
        <video
          controls
          preload="none"
          playsInline
          poster={media.poster}
          width={media.width ?? undefined}
          height={media.height ?? undefined}
          className="no-print block h-auto w-full bg-black"
        >
          <source src={media.src} type="video/mp4" />
          {t("Tarayıcın bu videoyu oynatamıyor.", "Your browser can't play this video.")}
        </video>
      ) : (
        <div className="no-print relative">
          {media.poster ? <img src={media.poster} alt="" className="block h-auto w-full" /> : null}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="size-7 fill-current" aria-hidden="true" />
            </span>
          </span>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">
            {t("Örnek video", "Sample video")}
          </span>
        </div>
      )}
      {/* Baskıda: kapak ve QR kodu. Dar sütunda QR kapağın altına geçer, sayfa sonunda bölünmez. */}
      <div className="print-only print-avoid-break">
        <div className="flex flex-wrap items-center gap-3">
          {media.poster ? <img src={media.poster} alt="" className="block h-auto min-w-0 flex-[1_1_9rem]" /> : null}
          {media.qrSvg ? (
            <div className="w-24 shrink-0 text-center text-[0.65rem] leading-tight">
              <div className="w-24" dangerouslySetInnerHTML={{ __html: media.qrSvg }} />
              <p className="mt-1">{t("Videoyu izlemek için QR kodu okut", "Scan the QR code to watch the video")}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Sesin kimliğinden türeyen sabit bir dalga görüntüsü (her kayıt kendine özgü görünür). */
function waveform(seed: string, bars: number): number[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return Array.from({ length: bars }, (_, i) => {
    h = Math.imul(h ^ (i + 1), 2246822519) >>> 0;
    const wave = Math.sin((i / bars) * Math.PI) * 0.55 + 0.25;
    return Math.round((wave + ((h % 1000) / 1000) * 0.45) * 100) / 100;
  });
}

export function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Sesli not: dalga görüntüsü, süre ve oynatıcı. Ses sadece oynat'a basılınca indirilir.
 * Basılı sayfada oynatıcı yerine QR kodu çıkar.
 */
export function NewsAudio({ media, className, locale = "tr" }: { media: NewsMedia; className?: string; locale?: Locale }) {
  const t = translator(locale);
  const duration = formatDuration(media.duration);
  return (
    <div className={cn("np-audio print-avoid-break flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3", className)}>
      <span aria-hidden="true" className="np-on-accent flex size-10 shrink-0 items-center justify-center rounded-full text-lg">
        🎙️
      </span>
      {/* Dar sütunda (özellikle baskıda) QR kodu alt satıra geçer; dalga çizgisi taşmaz. */}
      <div className="min-w-0 flex-[1_1_8rem]">
        <div className="flex h-7 items-center gap-[3px] overflow-hidden" aria-hidden="true">
          {waveform(media.id, 34).map((v, i) => (
            <span key={i} className="np-audio-bar w-[3px] shrink-0 rounded-full" style={{ height: `${Math.max(v * 100, 14)}%` }} />
          ))}
        </div>
        <p className="np-small np-muted mt-1 font-semibold">
          {t("Sesli not", "Voice note")}
          {duration ? ` · ${duration}` : ""}
        </p>
        {media.src ? (
          <audio controls preload="none" src={media.src} className="no-print mt-2 h-9 w-full">
            {t("Tarayıcın bu sesi çalamıyor.", "Your browser can't play this audio.")}
          </audio>
        ) : (
          <p className="no-print np-small np-muted mt-1 italic">{t("Örnek ses kaydı", "Sample recording")}</p>
        )}
      </div>
      {media.qrSvg ? (
        <div className="print-only w-16 shrink-0 text-center text-[0.55rem] leading-tight">
          <div dangerouslySetInnerHTML={{ __html: media.qrSvg }} />
          {t("Dinlemek için okut", "Scan to listen")}
        </div>
      ) : null}
    </div>
  );
}
