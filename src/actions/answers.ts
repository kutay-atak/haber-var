"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { deleteAsset, getMonthlyUsagePercent, signUpload, verifyUploadResponse, type UploadSignature } from "@/lib/cloudinary";
import { dbErrorMessage, GENERIC_ERROR } from "@/lib/errors";
import { effectiveStatus } from "@/lib/issues";
import { MEDIA_LIMITS, mediaPrefix } from "@/lib/media/limits";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MediaKind, MediaRow } from "@/lib/types";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const CLOSED = "Bu sayının süresi doldu, artık yanıt eklenemiyor.";

/** Soruyu, sayısını ve sayının hâlâ açık olup olmadığını (RLS ile) kontrol eder. */
async function loadOpenQuestion(questionId: string) {
  if (!z.uuid().safeParse(questionId).success) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("issue_questions")
    .select("id, issue_id, issues ( id, group_id, status, deadline_at )")
    .eq("id", questionId)
    .maybeSingle();
  if (!data?.issues) return null;
  const issue = data.issues as unknown as { id: string; group_id: string; status: "draft" | "open" | "published"; deadline_at: string };
  return { supabase, questionId: data.id as string, issue, isOpen: effectiveStatus(issue) === "open" };
}

export async function saveAnswer(questionId: string, body: string): Promise<Result<{ responseId: string }>> {
  const user = await requireUser();
  const text = String(body ?? "").slice(0, 5000);
  const ctx = await loadOpenQuestion(questionId);
  if (!ctx) return { ok: false, error: "Soru bulunamadı." };
  if (!ctx.isOpen) return { ok: false, error: CLOSED };

  const { data, error } = await ctx.supabase
    .from("responses")
    .upsert({ issue_question_id: questionId, user_id: user.id, body: text }, { onConflict: "issue_question_id,user_id" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: dbErrorMessage(error) };
  return { ok: true, responseId: data.id };
}

async function countMine(issueId: string, questionId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("response_media")
    .select("kind, responses!inner ( issue_question_id )")
    .eq("issue_id", issueId)
    .eq("user_id", userId);
  const rows = (data ?? []) as unknown as Array<{ kind: MediaKind; responses: { issue_question_id: string } }>;
  const here = rows.filter((r) => r.responses.issue_question_id === questionId);
  return {
    imagesHere: here.filter((r) => r.kind === "image").length,
    videosHere: here.filter((r) => r.kind === "video").length,
    videosInIssue: rows.filter((r) => r.kind === "video").length,
  };
}

export async function createUploadSignature(
  questionId: string,
  kind: MediaKind,
): Promise<Result<{ signature: UploadSignature }>> {
  const user = await requireUser();
  if (kind !== "image" && kind !== "video") return { ok: false, error: GENERIC_ERROR };
  const ctx = await loadOpenQuestion(questionId);
  if (!ctx) return { ok: false, error: "Soru bulunamadı." };
  if (!ctx.isOpen) return { ok: false, error: CLOSED };

  // Boşuna yükleme yapılmasın diye kotayı baştan kontrol et (veritabanı da ayrıca kontrol eder).
  const counts = await countMine(ctx.issue.id, questionId, user.id);
  if (kind === "image" && counts.imagesHere >= MEDIA_LIMITS.imagesPerAnswer) {
    return { ok: false, error: `Bir yanıta en fazla ${MEDIA_LIMITS.imagesPerAnswer} fotoğraf eklenebilir.` };
  }
  if (kind === "video") {
    if (counts.videosHere >= MEDIA_LIMITS.videosPerAnswer) {
      return { ok: false, error: "Bir yanıta en fazla 1 video eklenebilir." };
    }
    if (counts.videosInIssue >= MEDIA_LIMITS.videosPerIssue) {
      return { ok: false, error: `Bir sayıda en fazla ${MEDIA_LIMITS.videosPerIssue} video paylaşabilirsin.` };
    }
    const usage = await getMonthlyUsagePercent();
    if (usage !== null && usage >= MEDIA_LIMITS.videoQuotaCutoffPercent) {
      return {
        ok: false,
        error: "Bu ayın ücretsiz video kotası dolmak üzere. Şimdilik fotoğraf ekleyebilirsin; video hakkı ay başında yenilenir.",
      };
    }
  }

  const publicId = `${mediaPrefix(ctx.issue.group_id, ctx.issue.id, user.id)}${randomUUID()}`;
  return { ok: true, signature: signUpload(publicId, kind) };
}

const uploadSchema = z.object({
  public_id: z.string().min(1).max(300),
  version: z.union([z.number(), z.string()]),
  signature: z.string().min(1).max(200),
  bytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().nonnegative().optional(),
});

export async function attachMedia(
  questionId: string,
  kind: MediaKind,
  upload: z.input<typeof uploadSchema>,
): Promise<Result<{ media: MediaRow }>> {
  const user = await requireUser();
  const parsed = uploadSchema.safeParse(upload);
  if (!parsed.success || (kind !== "image" && kind !== "video")) return { ok: false, error: GENERIC_ERROR };
  const file = parsed.data;

  const ctx = await loadOpenQuestion(questionId);
  if (!ctx) return { ok: false, error: "Soru bulunamadı." };

  // Dosya gerçekten Cloudinary'den mi geldi ve bu kişinin klasöründe mi?
  const prefix = mediaPrefix(ctx.issue.group_id, ctx.issue.id, user.id);
  const genuine =
    file.public_id.startsWith(prefix) &&
    !file.public_id.includes("..") &&
    verifyUploadResponse(file.public_id, file.version, file.signature);
  if (!genuine) return { ok: false, error: "Yükleme doğrulanamadı. Lütfen tekrar dene." };

  const reject = async (error: string): Promise<Result<{ media: MediaRow }>> => {
    await deleteAsset(file.public_id, kind);
    return { ok: false, error };
  };
  if (!ctx.isOpen) return reject(CLOSED);
  const maxBytes = kind === "image" ? MEDIA_LIMITS.imageMaxBytes : MEDIA_LIMITS.videoMaxBytes;
  if (file.bytes > maxBytes) return reject("Dosya çok büyük.");

  // Yanıt satırı yoksa boş metinle oluştur (metni ezmeden).
  await ctx.supabase
    .from("responses")
    .upsert({ issue_question_id: questionId, user_id: user.id }, { onConflict: "issue_question_id,user_id", ignoreDuplicates: true });
  const { data: response } = await ctx.supabase
    .from("responses")
    .select("id")
    .eq("issue_question_id", questionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!response) return reject(GENERIC_ERROR);

  const { data: media, error } = await createAdminClient()
    .from("response_media")
    .insert({
      response_id: response.id,
      issue_id: ctx.issue.id,
      user_id: user.id,
      kind,
      public_id: file.public_id,
      width: file.width ?? null,
      height: file.height ?? null,
      duration_s: kind === "video" && file.duration !== undefined ? Math.round(file.duration * 100) / 100 : null,
      bytes: file.bytes,
    })
    .select("id, response_id, kind, public_id, width, height, duration_s, bytes, position")
    .single();
  if (error || !media) return reject(dbErrorMessage(error));
  return { ok: true, media: media as MediaRow };
}

export async function removeMedia(mediaId: string): Promise<Result> {
  const user = await requireUser();
  if (!z.uuid().safeParse(mediaId).success) return { ok: false, error: GENERIC_ERROR };
  const supabase = await createClient();
  const { data: media } = await supabase
    .from("response_media")
    .select("id, kind, public_id, user_id, issues ( status, deadline_at )")
    .eq("id", mediaId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!media) return { ok: false, error: "Dosya bulunamadı." };
  const issue = media.issues as unknown as { status: "draft" | "open" | "published"; deadline_at: string };
  if (effectiveStatus(issue) !== "open") return { ok: false, error: CLOSED };

  const { error } = await createAdminClient().from("response_media").delete().eq("id", mediaId);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  await deleteAsset(media.public_id, media.kind as MediaKind);
  return { ok: true };
}
