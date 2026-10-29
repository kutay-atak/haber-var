import { MediaError } from "./compress-image";
import { MEDIA_LIMITS } from "./limits";

// Videoyu tarayıcıda (WebCodecs ile, donanım hızlandırmalı) 720p H.264 MP4'e çevirir.
// 60 saniyeden uzun videoların ilk 60 saniyesi alınır. Kütüphane (mediabunny)
// sadece biri video seçtiğinde yüklenir, sayfayı yavaşlatmaz.

export interface CompressedVideo {
  blob: Blob;
  width: number;
  height: number;
  durationSeconds: number;
  trimmed: boolean;
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

export async function compressVideo(file: File, onProgress: (ratio: number) => void): Promise<CompressedVideo> {
  if (!file.type.startsWith("video/")) throw new MediaError("Bu bir video dosyası değil.");

  const mb = await import("mediabunny");
  const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });

  try {
    let duration: number;
    let track: Awaited<ReturnType<typeof input.getPrimaryVideoTrack>>;
    try {
      duration = await input.computeDuration();
      track = await input.getPrimaryVideoTrack();
    } catch {
      throw new MediaError("Bu video okunamadı. MP4 ya da MOV formatında bir video dener misin?");
    }
    if (!track) throw new MediaError("Bu dosyada görüntü bulunamadı.");

    const srcW = track.displayWidth;
    const srcH = track.displayHeight;
    const scale = Math.min(
      1,
      MEDIA_LIMITS.videoMaxShortSide / Math.min(srcW, srcH),
      MEDIA_LIMITS.videoMaxLongSide / Math.max(srcW, srcH),
    );
    const width = even(srcW * scale);
    const height = even(srcH * scale);
    const trimmed = duration > MEDIA_LIMITS.videoMaxSeconds + 0.5;
    const finalDuration = Math.min(duration, MEDIA_LIMITS.videoMaxSeconds);

    // Zaten küçük ve kısa bir MP4 ise hiç dokunmadan yükle.
    if (scale === 1 && !trimmed && file.type === "video/mp4" && file.size <= MEDIA_LIMITS.videoSkipCompressionBytes) {
      onProgress(1);
      return { blob: file, width: srcW, height: srcH, durationSeconds: finalDuration, trimmed: false };
    }

    const canEncode = await mb.canEncodeVideo("avc", {
      width,
      height,
      // Dikkat: düz sayı 0-1 arası bir kalite seviyesi demek; bit hızı nesne içinde verilmeli.
      quality: new mb.Quality({ bitrate: MEDIA_LIMITS.videoBitrate }),
    });
    if (!canEncode) {
      // Tarayıcı sıkıştıramıyorsa (ör. çok eski bir tarayıcı) küçük dosyaları olduğu gibi kabul et.
      if (!trimmed && file.size <= MEDIA_LIMITS.videoTargetBytes) {
        onProgress(1);
        return { blob: file, width: srcW, height: srcH, durationSeconds: finalDuration, trimmed: false };
      }
      throw new MediaError(
        "Tarayıcın bu videoyu küçültemiyor. Chrome, Edge ya da Safari'nin güncel bir sürümüyle dener misin? Ya da daha kısa bir video seç.",
      );
    }

    // ~60 fps telefon videolarını 30 fps'e indir (dosya boyutu yarıya düşer) ve
    // zaten düşük bit hızlı bir videoyu yeniden kodlarken şişirme.
    let frameRate: number | undefined;
    let targetBitrate: number = MEDIA_LIMITS.videoBitrate;
    try {
      const stats = await track.computePacketStats(120);
      if (stats.averagePacketRate > 32) frameRate = 30;
      if (stats.averageBitrate > 0) {
        targetBitrate = Math.min(targetBitrate, Math.max(600_000, Math.round(stats.averageBitrate)));
      }
    } catch {
      frameRate = undefined;
    }

    const run = async (bitrate: number) => {
      const output = new mb.Output({
        format: new mb.Mp4OutputFormat({ fastStart: "in-memory" }),
        target: new mb.BufferTarget(),
      });
      const conversion = await mb.Conversion.init({
        input,
        output,
        video: { width, height, fit: "contain", codec: "avc", quality: new mb.Quality({ bitrate }), frameRate },
        trim: trimmed ? { start: 0, end: MEDIA_LIMITS.videoMaxSeconds } : undefined,
        showWarnings: false,
      });
      if (!conversion.isValid) {
        throw new MediaError("Bu video dönüştürülemedi. Başka bir video dener misin?");
      }
      conversion.onProgress = (p) => onProgress(p);
      await conversion.execute();
      const buffer = output.target.buffer;
      if (!buffer) throw new MediaError("Video işlenirken bir sorun oldu.");
      return new Blob([buffer], { type: "video/mp4" });
    };

    let blob = await run(targetBitrate);
    if (blob.size > MEDIA_LIMITS.videoTargetBytes && targetBitrate > MEDIA_LIMITS.videoFallbackBitrate) {
      blob = await run(MEDIA_LIMITS.videoFallbackBitrate);
    }
    if (blob.size > MEDIA_LIMITS.videoMaxBytes) {
      throw new MediaError("Video küçültüldükten sonra bile çok büyük. Daha kısa bir video dener misin?");
    }
    onProgress(1);
    return { blob, width, height, durationSeconds: finalDuration, trimmed };
  } catch (error) {
    if (error instanceof MediaError) throw error;
    console.error("[video]", error);
    throw new MediaError("Video işlenirken bir sorun oldu. Başka bir video dener misin?");
  } finally {
    input.dispose();
  }
}
