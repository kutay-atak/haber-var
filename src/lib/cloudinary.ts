import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";
import type { MediaKind } from "@/lib/types";

let configured = false;
function client() {
  if (!configured) {
    cloudinary.config({
      cloud_name: publicEnv.cloudinaryCloudName,
      api_key: serverEnv.cloudinaryApiKey,
      api_secret: serverEnv.cloudinaryApiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

/** Cloudinary sesleri de "video" kaynağı olarak saklar. */
export type ResourceType = "image" | "video";
export const resourceTypeOf = (kind: MediaKind): ResourceType => (kind === "image" ? "image" : "video");

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  resourceType: ResourceType;
}

/**
 * Tarayıcının dosyayı doğrudan Cloudinary'ye yükleyebilmesi için imza üretir.
 * Dosya adı (public_id) imzaya dahil: kullanıcı başka bir klasöre yükleyemez.
 */
export function signUpload(publicId: string, kind: MediaKind): UploadSignature {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = client().utils.api_sign_request({ public_id: publicId, timestamp }, serverEnv.cloudinaryApiSecret);
  return {
    cloudName: publicEnv.cloudinaryCloudName,
    apiKey: serverEnv.cloudinaryApiKey,
    timestamp,
    signature,
    publicId,
    resourceType: resourceTypeOf(kind),
  };
}

/** Yükleme yanıtının gerçekten Cloudinary'den geldiğini doğrular. */
export function verifyUploadResponse(publicId: string, version: number | string, signature: string): boolean {
  const expected = createHash("sha1")
    .update(`public_id=${publicId}&version=${version}${serverEnv.cloudinaryApiSecret}`)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function deleteAsset(publicId: string, kind: MediaKind) {
  try {
    await client().uploader.destroy(publicId, { resource_type: resourceTypeOf(kind), invalidate: true });
  } catch (error) {
    console.error("[cloudinary] silinemedi", publicId, error);
  }
}

/** Bir klasördeki (grup ya da sayı) tüm fotoğraf, video ve sesli notları siler. */
export async function deleteFolder(prefix: string) {
  for (const resourceType of ["image", "video"] as const) {
    try {
      await client().api.delete_resources_by_prefix(prefix, { resource_type: resourceType, invalidate: true });
    } catch (error) {
      console.error("[cloudinary] klasör silinemedi", prefix, resourceType, error);
    }
  }
}

let usageCache: { at: number; percent: number | null } | null = null;

/** Bu ay kullanılan Cloudinary kredisi yüzdesi (10 dakika önbellekli). Bilinmiyorsa null. */
export async function getMonthlyUsagePercent(): Promise<number | null> {
  if (usageCache && Date.now() - usageCache.at < 10 * 60_000) return usageCache.percent;
  let percent: number | null = null;
  try {
    const usage = await client().api.usage();
    const credits = usage?.credits;
    if (typeof credits?.used_percent === "number") percent = credits.used_percent;
    else if (typeof credits?.usage === "number" && typeof credits?.limit === "number" && credits.limit > 0) {
      percent = (credits.usage / credits.limit) * 100;
    }
  } catch (error) {
    console.error("[cloudinary] kullanım bilgisi alınamadı", error);
  }
  usageCache = { at: Date.now(), percent };
  return percent;
}
