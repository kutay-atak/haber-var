"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { deleteAsset, getMonthlyUsagePercent, signUpload, verifyUploadResponse, type UploadSignature } from "@/lib/cloudinary";
import { dbErrorMessage, genericError } from "@/lib/errors";
import type { T as Translate } from "@/lib/i18n";
import { getT } from "@/lib/i18n-server";
import { effectiveStatus } from "@/lib/issues";
import { MEDIA_LIMITS, mediaPrefix } from "@/lib/media/limits";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { MediaKind, MediaRow } from "@/lib/types";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const MEDIA_KINDS: readonly MediaKind[] = ["image", "video", "audio"];
const isMediaKind = (kind: unknown): kind is MediaKind => MEDIA_KINDS.includes(kind as MediaKind);

const closed = (t: Translate) =>
  t("Bu sayının süresi doldu, artık yanıt eklenemiyor.", "This issue's deadline has passed; answers can't be added anymore.");
const noQuestion = (t: Translate) => t("Soru bulunamadı.", "Question not found.");

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
  const t = await getT();
  const text = String(body ?? "").slice(0, 5000);
  const ctx = await loadOpenQuestion(questionId);
  if (!ctx) return { ok: false, error: noQuestion(t) };
  if (!ctx.isOpen) return { ok: false, error: closed(t) };

  const { data, error } = await ctx.supabase
    .from("responses")
    .upsert({ issue_question_id: questionId, user_id: user.id, body: text }, { onConflict: "issue_question_id,user_id" })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: dbErrorMessage(error, t) };
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
    audioHere: here.filter((r) => r.kind === "audio").length,
    videosInIssue: rows.filter((r) => r.kind === "video").length,
  };
}

export async function createUploadSignature(
  questionId: string,
  kind: MediaKind,
): Promise<Result<{ signature: UploadSignature }>> {
  const user = await requireUser();
  const t = await getT();
  if (!isMediaKind(kind)) return { ok: false, error: genericError(t) };
  const ctx = await loadOpenQuestion(questionId);
  if (!ctx) return { ok: false, error: noQuestion(t) };
  if (!ctx.isOpen) return { ok: false, error: closed(t) };

  // Boşuna yükleme yapılmasın diye kotayı baştan kontrol et (veritabanı da ayrıca kontrol eder).
  const counts = await countMine(ctx.issue.id, questionId, user.id);
  if (kind === "image" && counts.imagesHere >= MEDIA_LIMITS.imagesPerAnswer) {
    return {
      ok: false,
      error: t(
        `Bir yanıta en fazla ${MEDIA_LIMITS.imagesPerAnswer} fotoğraf eklenebilir.`,
        `An answer can have at most ${MEDIA_LIMITS.imagesPerAnswer} photos.`,
      ),
    };
  }
  if (kind === "audio" && counts.audioHere >= MEDIA_LIMITS.audioPerAnswer) {
    return { ok: false, error: t("Bir yanıta en fazla 1 sesli not eklenebilir.", "An answer can have at most 1 voice note.") };
  }
  if (kind === "video") {
    if (counts.videosHere >= MEDIA_LIMITS.videosPerAnswer) {
      return { ok: false, error: t("Bir yanıta en fazla 1 video eklenebilir.", "An answer can have at most 1 video.") };
    }
    if (counts.videosInIssue >= MEDIA_LIMITS.videosPerIssue) {
      return {
        ok: false,
        error: t(
          `Bir sayıda en fazla ${MEDIA_LIMITS.videosPerIssue} video paylaşabilirsin.`,
          `You can share at most ${MEDIA_LIMITS.videosPerIssue} videos per issue.`,
        ),
      };
    }
    const usage = await getMonthlyUsagePercent();
    if (usage !== null && usage >= MEDIA_LIMITS.videoQuotaCutoffPercent) {
      return {
        ok: false,
        error: t(
          "Bu ayın ücretsiz video kotası dolmak üzere. Şimdilik fotoğraf ekleyebilirsin; video hakkı ay başında yenilenir.",
          "This month's free video quota is almost used up. You can still add photos; videos come back at the start of next month.",
        ),
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
  const t = await getT();
  const parsed = uploadSchema.safeParse(upload);
  if (!parsed.success || !isMediaKind(kind)) return { ok: false, error: genericError(t) };
  const file = parsed.data;

  const ctx = await loadOpenQuestion(questionId);
  if (!ctx) return { ok: false, error: noQuestion(t) };

  // Dosya gerçekten Cloudinary'den mi geldi ve bu kişinin klasöründe mi?
  const prefix = mediaPrefix(ctx.issue.group_id, ctx.issue.id, user.id);
  const genuine =
    file.public_id.startsWith(prefix) &&
    !file.public_id.includes("..") &&
    verifyUploadResponse(file.public_id, file.version, file.signature);
  if (!genuine) return { ok: false, error: t("Yükleme doğrulanamadı. Lütfen tekrar dene.", "The upload couldn't be verified. Please try again.") };

  const reject = async (error: string): Promise<Result<{ media: MediaRow }>> => {
    await deleteAsset(file.public_id, kind);
    return { ok: false, error };
  };
  if (!ctx.isOpen) return reject(closed(t));
  const maxBytes =
    kind === "image" ? MEDIA_LIMITS.imageMaxBytes : kind === "audio" ? MEDIA_LIMITS.audioMaxBytes : MEDIA_LIMITS.videoMaxBytes;
  if (file.bytes > maxBytes) return reject(t("Dosya çok büyük.", "The file is too large."));

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
  if (!response) return reject(genericError(t));

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
      duration_s: kind !== "image" && file.duration !== undefined ? Math.round(file.duration * 100) / 100 : null,
      bytes: file.bytes,
    })
    .select("id, response_id, kind, public_id, width, height, duration_s, bytes, position")
    .single();
  if (error || !media) return reject(dbErrorMessage(error, t));
  return { ok: true, media: media as MediaRow };
}

export async function removeMedia(mediaId: string): Promise<Result> {
  const user = await requireUser();
  const t = await getT();
  if (!z.uuid().safeParse(mediaId).success) return { ok: false, error: genericError(t) };
  const supabase = await createClient();
  const { data: media } = await supabase
    .from("response_media")
    .select("id, kind, public_id, user_id, issues ( status, deadline_at )")
    .eq("id", mediaId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!media) return { ok: false, error: t("Dosya bulunamadı.", "File not found.") };
  const issue = media.issues as unknown as { status: "draft" | "open" | "published"; deadline_at: string };
  if (effectiveStatus(issue) !== "open") return { ok: false, error: closed(t) };

  const { error } = await createAdminClient().from("response_media").delete().eq("id", mediaId);
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  await deleteAsset(media.public_id, media.kind as MediaKind);
  return { ok: true };
}
