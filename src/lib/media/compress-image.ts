import { MEDIA_LIMITS } from "./limits";
import { documentT } from "@/lib/i18n";

// Fotoğrafı tarayıcıda küçültür: uzun kenar en fazla 1600 px, WebP (Safari'de JPEG).
// Yeniden çizim sırasında konum gibi EXIF bilgileri de silinir.

export class MediaError extends Error {}

export interface CompressedImage {
  blob: Blob;
  width: number;
  height: number;
}

async function encode(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<CompressedImage> {
  if (!file.type.startsWith("image/")) throw new MediaError(documentT()("Bu bir fotoğraf dosyası değil.", "This isn't a photo file."));

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new MediaError(
      documentT()(
        "Bu fotoğraf açılamadı. JPEG ya da PNG olarak tekrar dener misin? (iPhone'da HEIC yerine \"En Uyumlu\" ayarı işe yarar.)",
        "This photo couldn't be opened. Could you try again as a JPEG or PNG? (On iPhone, the \"Most Compatible\" camera setting helps.)",
      ),
    );
  }

  const scale = Math.min(1, MEDIA_LIMITS.imageMaxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new MediaError(documentT()("Tarayıcın fotoğrafı işleyemedi.", "Your browser couldn't process the photo."));
  ctx.fillStyle = "#ffffff"; // Saydam PNG'ler JPEG'e çevrilirse arka plan siyah olmasın.
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // Önce WebP dene; Safari WebP üretemezse PNG döndürür, o zaman JPEG'e geç.
  for (const quality of [0.82, 0.7, 0.58]) {
    let blob = await encode(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") blob = await encode(canvas, "image/jpeg", quality);
    if (blob && blob.size <= MEDIA_LIMITS.imageMaxBytes) return { blob, width, height };
  }
  throw new MediaError(
    documentT()("Fotoğraf yeterince küçültülemedi. Daha küçük bir fotoğraf dener misin?", "The photo couldn't be made small enough. Could you try a smaller one?"),
  );
}
