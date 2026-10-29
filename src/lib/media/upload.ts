import type { UploadSignature } from "@/lib/cloudinary";
import { MediaError } from "./compress-image";

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

/** Dosyayı doğrudan tarayıcıdan Cloudinary'ye yükler (Vercel'den geçmez). */
export function uploadToCloudinary(
  blob: Blob,
  sig: UploadSignature,
  onProgress: (ratio: number) => void,
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", blob);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("signature", sig.signature);
    form.append("public_id", sig.publicId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      let data: (CloudinaryUploadResult & { error?: { message?: string } }) | null = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.public_id) resolve(data);
      else {
        console.error("[cloudinary] yükleme hatası", xhr.status, data?.error?.message);
        reject(new MediaError("Dosya yüklenemedi. Birazdan tekrar dener misin?"));
      }
    };
    xhr.onerror = () => reject(new MediaError("Bağlantı koptu. İnternetini kontrol edip tekrar dene."));
    xhr.send(form);
  });
}
