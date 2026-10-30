import { publicEnv } from "@/lib/env";

// Cloudinary teslim adresleri. Hem sunucuda hem tarayıcıda kullanılır.
// f_auto/q_auto: tarayıcıya en uygun format ve kalite (genelde WebP/AVIF) otomatik seçilir.

function base() {
  return `https://res.cloudinary.com/${publicEnv.cloudinaryCloudName}`;
}

export function imageUrl(publicId: string, { width, height }: { width: number; height?: number }) {
  const crop = height ? `c_fill,w_${width},h_${height}` : `c_limit,w_${width}`;
  return `${base()}/image/upload/f_auto,q_auto,${crop}/${publicId}`;
}

export function imageSrcSet(publicId: string, widths: number[] = [480, 800, 1200, 1600]) {
  return widths.map((w) => `${imageUrl(publicId, { width: w })} ${w}w`).join(", ");
}

/** Video zaten tarayıcıda sıkıştırıldı; dönüştürme kredisi harcamamak için olduğu gibi sunulur. */
export function videoUrl(publicId: string) {
  return `${base()}/video/upload/${publicId}.mp4`;
}

/** Videonun ilk karesinden kapak görseli. */
export function videoPosterUrl(publicId: string, width = 960) {
  return `${base()}/video/upload/so_0,f_jpg,q_auto,c_limit,w_${width}/${publicId}.jpg`;
}

/** Sesli not: tarayıcı WebM ya da M4A kaydeder; her cihazda çalsın diye MP3 olarak sunulur. */
export function audioUrl(publicId: string) {
  return `${base()}/video/upload/${publicId}.mp3`;
}
