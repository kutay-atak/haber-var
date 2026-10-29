"use client";

import { Check, CircleAlert, Film, ImagePlus, LoaderCircle, Play, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { attachMedia, createUploadSignature, removeMedia, saveAnswer } from "@/actions/answers";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { imageUrl, videoPosterUrl } from "@/lib/cloudinary-url";
import { compressImage, MediaError } from "@/lib/media/compress-image";
import { MEDIA_LIMITS } from "@/lib/media/limits";
import { uploadToCloudinary } from "@/lib/media/upload";
import type { MediaKind, MediaRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UploadItem {
  id: string;
  kind: MediaKind;
  stage: "compressing" | "uploading";
  progress: number;
  previewUrl?: string;
}

const STAGE_LABEL = { compressing: "Küçültülüyor", uploading: "Yükleniyor" } as const;

export function QuestionCard({
  index,
  total,
  questionId,
  text,
  initialBody,
  initialMedia,
  onContentChange,
}: {
  index: number;
  total: number;
  questionId: string;
  text: string;
  initialBody: string;
  initialMedia: MediaRow[];
  onContentChange: (questionId: string, hasContent: boolean) => void;
}) {
  const [body, setBody] = useState(initialBody);
  const [savedBody, setSavedBody] = useState(initialBody);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaRow[]>(initialMedia);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaNotice, setMediaNotice] = useState<string | null>(null);

  const timer = useRef<number | null>(null);
  const lastSaved = useRef(initialBody);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const dirty = body !== savedBody || uploads.length > 0;
  const images = media.filter((m) => m.kind === "image");
  const videos = media.filter((m) => m.kind === "video");
  const uploadingImages = uploads.filter((u) => u.kind === "image").length;
  const uploadingVideos = uploads.filter((u) => u.kind === "video").length;
  const imageSlots = MEDIA_LIMITS.imagesPerAnswer - images.length - uploadingImages;
  const videoSlots = MEDIA_LIMITS.videosPerAnswer - videos.length - uploadingVideos;

  // Kaydedilmemiş yazı ya da süren yükleme varken sayfadan çıkarken uyar.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function persist(next: string) {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    if (next === lastSaved.current) return;
    setStatus("saving");
    setSaveError(null);
    try {
      const result = await saveAnswer(questionId, next);
      if (!result.ok) throw new MediaError(result.error);
      lastSaved.current = next;
      setSavedBody(next);
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      setSaveError(error instanceof MediaError ? error.message : "Kaydedilemedi. İnternet bağlantını kontrol et.");
    }
  }

  function handleChange(next: string) {
    setBody(next);
    onContentChange(questionId, next.trim().length > 0 || media.length > 0);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void persist(next), 900);
  }

  async function processFile(file: File, kind: MediaKind) {
    const id = crypto.randomUUID();
    const previewUrl = kind === "image" ? URL.createObjectURL(file) : undefined;
    const update = (patch: Partial<UploadItem>) =>
      setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setUploads((list) => [...list, { id, kind, stage: "compressing", progress: 0, previewUrl }]);

    try {
      let prepared: { blob: Blob };
      if (kind === "image") {
        prepared = await compressImage(file);
      } else {
        const { compressVideo } = await import("@/lib/media/compress-video");
        const video = await compressVideo(file, (p) => update({ progress: p }));
        if (video.trimmed) setMediaNotice(`Video ${MEDIA_LIMITS.videoMaxSeconds} saniyeden uzundu; ilk ${MEDIA_LIMITS.videoMaxSeconds} saniyesi eklendi.`);
        prepared = video;
      }

      const signed = await createUploadSignature(questionId, kind);
      if (!signed.ok) throw new MediaError(signed.error);
      update({ stage: "uploading", progress: 0 });
      const uploaded = await uploadToCloudinary(prepared.blob, signed.signature, (p) => update({ progress: p }));

      const attached = await attachMedia(questionId, kind, {
        public_id: uploaded.public_id,
        version: uploaded.version,
        signature: uploaded.signature,
        bytes: uploaded.bytes,
        width: uploaded.width,
        height: uploaded.height,
        duration: uploaded.duration,
      });
      if (!attached.ok) throw new MediaError(attached.error);
      setMedia((list) => [...list, attached.media]);
      onContentChange(questionId, true);
    } catch (error) {
      console.error(error);
      setMediaError(error instanceof MediaError ? error.message : "Dosya eklenemedi. Birazdan tekrar dener misin?");
    } finally {
      setUploads((list) => list.filter((u) => u.id !== id));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  }

  async function handleFiles(files: FileList | null, kind: MediaKind) {
    if (!files?.length) return;
    setMediaError(null);
    setMediaNotice(null);
    const slots = kind === "image" ? imageSlots : videoSlots;
    const list = Array.from(files);
    if (list.length > slots) {
      setMediaNotice(
        kind === "image"
          ? `Bir yanıta en fazla ${MEDIA_LIMITS.imagesPerAnswer} fotoğraf eklenebilir; ilk ${Math.max(slots, 0)} tanesi ekleniyor.`
          : "Bir yanıta en fazla 1 video eklenebilir.",
      );
    }
    // Telefonda belleği zorlamamak için dosyaları sırayla işle.
    for (const file of list.slice(0, Math.max(slots, 0))) await processFile(file, kind);
  }

  async function handleRemove(item: MediaRow) {
    if (!window.confirm(item.kind === "image" ? "Bu fotoğraf silinsin mi?" : "Bu video silinsin mi?")) return;
    setMediaError(null);
    const rest = media.filter((m) => m.id !== item.id);
    setMedia(rest);
    onContentChange(questionId, body.trim().length > 0 || rest.length > 0);
    const result = await removeMedia(item.id);
    if (!result.ok) {
      setMedia((list) => [...list, item].sort((a, b) => a.position - b.position));
      onContentChange(questionId, true);
      setMediaError(result.error);
    }
  }

  return (
    <article className="animate-pop rounded-[1.75rem] border border-line/80 bg-paper p-5 shadow-soft sm:p-7">
      <p className="text-sm font-extrabold uppercase tracking-widest text-terracotta-deep">
        Soru {index + 1}/{total}
      </p>
      <h2 className="mt-1.5 text-2xl font-semibold leading-snug">
        <label htmlFor={`answer-${questionId}`}>{text}</label>
      </h2>

      <textarea
        id={`answer-${questionId}`}
        value={body}
        maxLength={5000}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => void persist(body)}
        placeholder="Aklına geleni yaz… Kısa ya da uzun, nasıl istersen."
        className={cn(
          "mt-4 min-h-36 w-full resize-y rounded-2xl border-2 border-line bg-white px-4 py-3 text-[1.05rem] leading-relaxed",
          "placeholder:text-ink-soft/70 focus:border-terracotta focus:outline-none focus:ring-4 focus:ring-terracotta/15",
          "[field-sizing:content] max-h-[70vh]",
        )}
      />

      <div className="mt-2 flex min-h-6 flex-wrap items-center justify-between gap-2 text-sm font-semibold">
        <span aria-live="polite" className="flex items-center gap-1.5 text-ink-soft">
          {status === "saving" ? (
            <>
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Kaydediliyor…
            </>
          ) : status === "saved" && !dirty ? (
            <span className="flex items-center gap-1.5 text-sage-deep">
              <Check className="size-4" aria-hidden="true" /> Kaydedildi
            </span>
          ) : status === "error" ? (
            <span className="flex items-center gap-1.5 text-[#8e2a20]">
              <CircleAlert className="size-4" aria-hidden="true" /> {saveError}
              <button type="button" className="underline" onClick={() => void persist(body)}>
                Tekrar dene
              </button>
            </span>
          ) : null}
        </span>
        {body.length > 4000 ? <span className="text-ink-soft">{body.length}/5000</span> : null}
      </div>

      {media.length || uploads.length ? (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {media.map((m) => (
            <li key={m.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-sand">
              <img
                src={m.kind === "image" ? imageUrl(m.public_id, { width: 320, height: 320 }) : videoPosterUrl(m.public_id, 320)}
                alt={m.kind === "image" ? "Eklediğin fotoğraf" : "Eklediğin videonun kapağı"}
                className="size-full object-cover"
                loading="lazy"
              />
              {m.kind === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                  <span className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow">
                    <Play className="size-5 fill-ink text-ink" aria-hidden="true" />
                  </span>
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => void handleRemove(m)}
                className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-white/95 text-ink shadow transition hover:bg-[#fbe4e1] hover:text-[#8e2a20]"
                aria-label="Sil"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
          {uploads.map((u) => (
            <li key={u.id} className="relative aspect-square overflow-hidden rounded-2xl bg-sand">
              {u.previewUrl ? (
                <img src={u.previewUrl} alt="" className="size-full object-cover opacity-60" />
              ) : (
                <span className="flex size-full items-center justify-center">
                  <Film className="size-8 text-ink-soft" aria-hidden="true" />
                </span>
              )}
              <span className="absolute inset-x-2 bottom-2 rounded-xl bg-white/95 px-2 py-1.5 text-center text-xs font-bold shadow">
                {STAGE_LABEL[u.stage]} {u.progress > 0 ? `%${Math.round(u.progress * 100)}` : "…"}
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-sand">
                  <span
                    className={cn("block h-full rounded-full", u.stage === "compressing" ? "bg-mustard" : "bg-sage")}
                    style={{ width: `${Math.max(u.progress * 100, 6)}%` }}
                  />
                </span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {mediaNotice ? (
        <Alert tone="info" className="mt-3">
          {mediaNotice}
        </Alert>
      ) : null}
      {mediaError ? (
        <Alert tone="error" className="mt-3">
          {mediaError}
        </Alert>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          ref={imageInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files, "image");
            e.target.value = "";
          }}
        />
        <input
          ref={videoInput}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            void handleFiles(e.target.files, "video");
            e.target.value = "";
          }}
        />
        <Button variant="secondary" size="sm" onClick={() => imageInput.current?.click()} disabled={imageSlots <= 0}>
          <ImagePlus className="size-4" aria-hidden="true" /> Fotoğraf ekle
          <span className="text-ink-soft">
            ({images.length}/{MEDIA_LIMITS.imagesPerAnswer})
          </span>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => videoInput.current?.click()} disabled={videoSlots <= 0}>
          <Video className="size-4" aria-hidden="true" /> Video ekle
        </Button>
        <span className="text-xs font-semibold text-ink-soft">
          Videolar en fazla {MEDIA_LIMITS.videoMaxSeconds} sn; otomatik küçültülür.
        </span>
      </div>
    </article>
  );
}
