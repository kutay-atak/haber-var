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
      <div className="print-only">
        <div className="flex items-center gap-4">
          {media.poster ? <img src={media.poster} alt="" className="block h-auto w-2/3" /> : null}
          {media.qrSvg ? (
            <div className="w-1/3 space-y-1 text-center text-xs">
              <div className="mx-auto w-24" dangerouslySetInnerHTML={{ __html: media.qrSvg }} />
              <p>{t("Videoyu izlemek için QR kodu okut", "Scan the QR code to watch the video")}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
