"use client";

import { Check, CircleAlert, Film, ImagePlus, LoaderCircle, Mic, Play, Video, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { attachMedia, createUploadSignature, removeMedia, saveAnswer } from "@/actions/answers";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { audioUrl, imageUrl, videoPosterUrl } from "@/lib/cloudinary-url";
import { compressImage, MediaError } from "@/lib/media/compress-image";
import { MEDIA_LIMITS } from "@/lib/media/limits";
import { uploadToCloudinary } from "@/lib/media/upload";
import type { MediaKind, MediaRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n";
import { AudioRecorder } from "./audio-recorder";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UploadItem {
  id: string;
  kind: MediaKind;
  stage: "compressing" | "uploading";
  progress: number;
  previewUrl?: string;
}

const STAGE_LABEL = {
  compressing: ["Küçültülüyor", "Compressing"],
  uploading: ["Yükleniyor", "Uploading"],
} as const;

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
  const t = useT();

  const timer = useRef<number | null>(null);
  const lastSaved = useRef(initialBody);
  const imageInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const dirty = body !== savedBody || uploads.length > 0;
  const [recording, setRecording] = useState(false);
  const images = media.filter((m) => m.kind === "image");
  const videos = media.filter((m) => m.kind === "video");
  const audios = media.filter((m) => m.kind === "audio");
  const visual = media.filter((m) => m.kind !== "audio");
  const uploadingImages = uploads.filter((u) => u.kind === "image").length;
  const uploadingVideos = uploads.filter((u) => u.kind === "video").length;
  const uploadingAudio = uploads.filter((u) => u.kind === "audio").length;
  const imageSlots = MEDIA_LIMITS.imagesPerAnswer - images.length - uploadingImages;
  const videoSlots = MEDIA_LIMITS.videosPerAnswer - videos.length - uploadingVideos;
  const audioSlots = MEDIA_LIMITS.audioPerAnswer - audios.length - uploadingAudio;

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
      setSaveError(error instanceof MediaError ? error.message : t("Kaydedilemedi. İnternet bağlantını kontrol et.", "Couldn't save. Check your internet connection."));
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
      } else if (kind === "audio") {
        // Kayıt tarayıcıda zaten küçük (≈64 kbps); hazır dosyalar için sadece boyut sınırı var.
        if (file.size > MEDIA_LIMITS.audioMaxBytes) {
          throw new MediaError(t("Ses dosyası çok büyük (en fazla 10 MB).", "The audio file is too large (10 MB at most)."));
        }
        prepared = { blob: file };
      } else {
        const { compressVideo } = await import("@/lib/media/compress-video");
        const video = await compressVideo(file, (p) => update({ progress: p }));
        if (video.trimmed) {
          setMediaNotice(
            t(
              `Video ${MEDIA_LIMITS.videoMaxSeconds} saniyeden uzundu; ilk ${MEDIA_LIMITS.videoMaxSeconds} saniyesi eklendi.`,
              `The video was longer than ${MEDIA_LIMITS.videoMaxSeconds} seconds; the first ${MEDIA_LIMITS.videoMaxSeconds} seconds were added.`,
            ),
          );
        }
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
      setMediaError(
        error instanceof MediaError ? error.message : t("Dosya eklenemedi. Birazdan tekrar dener misin?", "The file couldn't be added. Could you try again in a moment?"),
      );
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
          ? t(
              `Bir yanıta en fazla ${MEDIA_LIMITS.imagesPerAnswer} fotoğraf eklenebilir; ilk ${Math.max(slots, 0)} tanesi ekleniyor.`,
              `An answer can have at most ${MEDIA_LIMITS.imagesPerAnswer} photos; adding the first ${Math.max(slots, 0)}.`,
            )
          : t("Bir yanıta en fazla 1 video eklenebilir.", "An answer can have at most 1 video."),
      );
    }
    // Telefonda belleği zorlamamak için dosyaları sırayla işle.
    for (const file of list.slice(0, Math.max(slots, 0))) await processFile(file, kind);
  }

  async function handleRemove(item: MediaRow) {
    const question =
      item.kind === "image"
        ? t("Bu fotoğraf silinsin mi?", "Delete this photo?")
        : item.kind === "audio"
          ? t("Bu sesli not silinsin mi?", "Delete this voice note?")
          : t("Bu video silinsin mi?", "Delete this video?");
    if (!window.confirm(question)) return;
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
        {t("Soru", "Question")} {index + 1}/{total}
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
        placeholder={t("Aklına geleni yaz… Kısa ya da uzun, nasıl istersen.", "Write whatever comes to mind… Short or long, as you like.")}
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
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> {t("Kaydediliyor…", "Saving…")}
            </>
          ) : status === "saved" && !dirty ? (
            <span className="flex items-center gap-1.5 text-sage-deep">
              <Check className="size-4" aria-hidden="true" /> {t("Kaydedildi", "Saved")}
            </span>
          ) : status === "error" ? (
            <span className="flex items-center gap-1.5 text-[#8e2a20]">
              <CircleAlert className="size-4" aria-hidden="true" /> {saveError}
              <button type="button" className="underline" onClick={() => void persist(body)}>
                {t("Tekrar dene", "Try again")}
              </button>
            </span>
          ) : null}
        </span>
        {body.length > 4000 ? <span className="text-ink-soft">{body.length}/5000</span> : null}
      </div>

      {audios.map((m) => (
        <div key={m.id} className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-terracotta-soft text-terracotta-deep">
            <Mic className="size-5" aria-hidden="true" />
          </span>
          <audio controls preload="none" src={audioUrl(m.public_id)} className="h-10 min-w-0 flex-1" />
          <button
            type="button"
            onClick={() => void handleRemove(m)}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition hover:bg-[#fbe4e1] hover:text-[#8e2a20]"
            aria-label={t("Sesli notu sil", "Delete voice note")}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}

      {recording && audioSlots > 0 ? (
        <AudioRecorder
          onCancel={() => setRecording(false)}
          onDone={(file) => {
            setRecording(false);
            setMediaError(null);
            void processFile(file, "audio");
          }}
        />
      ) : null}

      {visual.length || uploads.length ? (
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {visual.map((m) => (
            <li key={m.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-sand">
              <img
                src={m.kind === "image" ? imageUrl(m.public_id, { width: 320, height: 320 }) : videoPosterUrl(m.public_id, 320)}
                alt={m.kind === "image" ? t("Eklediğin fotoğraf", "Your photo") : t("Eklediğin videonun kapağı", "Your video's cover")}
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
                aria-label={t("Sil", "Delete")}
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
                  {u.kind === "audio" ? (
                    <Mic className="size-8 text-ink-soft" aria-hidden="true" />
                  ) : (
                    <Film className="size-8 text-ink-soft" aria-hidden="true" />
                  )}
                </span>
              )}
              <span className="absolute inset-x-2 bottom-2 rounded-xl bg-white/95 px-2 py-1.5 text-center text-xs font-bold shadow">
                {t(STAGE_LABEL[u.stage][0], STAGE_LABEL[u.stage][1])} {u.progress > 0 ? t(`%${Math.round(u.progress * 100)}`, `${Math.round(u.progress * 100)}%`) : "…"}
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
          <ImagePlus className="size-4" aria-hidden="true" /> {t("Fotoğraf ekle", "Add photo")}
          <span className="text-ink-soft">
            ({images.length}/{MEDIA_LIMITS.imagesPerAnswer})
          </span>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => videoInput.current?.click()} disabled={videoSlots <= 0}>
          <Video className="size-4" aria-hidden="true" /> {t("Video ekle", "Add video")}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setRecording(true)} disabled={audioSlots <= 0 || recording}>
          <Mic className="size-4" aria-hidden="true" /> {t("Sesli not ekle", "Add voice note")}
        </Button>
        <span className="text-xs font-semibold text-ink-soft">
          {t(
            `Videolar en fazla ${MEDIA_LIMITS.videoMaxSeconds} sn; otomatik küçültülür.`,
            `Videos up to ${MEDIA_LIMITS.videoMaxSeconds} s; compressed automatically.`,
          )}
        </span>
      </div>
    </article>
  );
}
