"use client";

import { Mic, RotateCcw, Square, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { MEDIA_LIMITS } from "@/lib/media/limits";

/** Tarayıcının kaydedebildiği, olabildiğince küçük ses biçimi. */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type));
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Sesli not kaydedici: kaydet → dinle → ekle. Kayıt en fazla 2 dakika sürer ve
 * tarayıcıda ~64 kbps ile sıkıştırılır (2 dakika ≈ 1 MB). İstersen hazır bir ses dosyası da seçilebilir.
 */
export function AudioRecorder({ onDone, onCancel }: { onDone: (file: File, seconds: number | null) => void; onCancel: () => void }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "recording" | "review">("idle");
  const [seconds, setSeconds] = useState(0);
  const [take, setTake] = useState<{ file: File; url: string; seconds: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  function release() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }

  // Sayfadan çıkınca mikrofonu kapat ve önizleme adresini bırak.
  useEffect(() => {
    return () => {
      release();
      if (recorder.current?.state === "recording") recorder.current.stop();
    };
  }, []);
  useEffect(() => () => (take ? URL.revokeObjectURL(take.url) : undefined), [take]);

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError(t("Tarayıcın ses kaydını desteklemiyor. Bunun yerine bir ses dosyası seçebilirsin.", "Your browser can't record audio. You can pick an audio file instead."));
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setError(t("Mikrofona izin verilmedi. Tarayıcı ayarlarından izin verip tekrar dene.", "Microphone access was denied. Allow it in your browser settings and try again."));
      return;
    }
    const mimeType = pickMimeType();
    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream.current, { mimeType, audioBitsPerSecond: MEDIA_LIMITS.audioBitrate });
    rec.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    rec.onstop = () => {
      release();
      const type = rec.mimeType || mimeType || "audio/webm";
      const length = Math.min((Date.now() - startedAt.current) / 1000, MEDIA_LIMITS.audioMaxSeconds);
      const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
      const file = new File(chunks, `sesli-not.${extension}`, { type });
      setTake({ file, url: URL.createObjectURL(file), seconds: length });
      setState("review");
    };
    recorder.current = rec;
    startedAt.current = Date.now();
    setSeconds(0);
    rec.start(1000);
    setState("recording");
    timer.current = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      setSeconds(elapsed);
      if (elapsed >= MEDIA_LIMITS.audioMaxSeconds) stop();
    }, 250);
  }

  function stop() {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  function retake() {
    setTake(null);
    setState("idle");
    setSeconds(0);
  }

  return (
    <div className="mt-4 rounded-2xl border-2 border-dashed border-terracotta/40 bg-terracotta-soft/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-bold">
          <Mic className="size-4 text-terracotta-deep" aria-hidden="true" /> {t("Sesli not", "Voice note")}
          <span className="text-sm font-semibold text-ink-soft">
            · {t(`en fazla ${MEDIA_LIMITS.audioMaxSeconds / 60} dakika`, `up to ${MEDIA_LIMITS.audioMaxSeconds / 60} minutes`)}
          </span>
        </p>
        <button type="button" onClick={onCancel} className="rounded-full p-1 text-ink-soft hover:bg-sand hover:text-ink" aria-label={t("Kapat", "Close")}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {state === "recording" ? (
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-2 font-display text-2xl font-semibold tabular-nums" aria-live="polite">
            <span className="size-3 animate-pulse rounded-full bg-[#d64545]" aria-hidden="true" />
            {clock(seconds)}
            <span className="text-base text-ink-soft">/ {clock(MEDIA_LIMITS.audioMaxSeconds)}</span>
          </span>
          <span className="flex h-6 items-end gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-1.5 animate-pulse rounded-full bg-terracotta" style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 120}ms` }} />
            ))}
          </span>
          <Button size="sm" onClick={stop}>
            <Square className="size-4 fill-current" aria-hidden="true" /> {t("Bitir", "Stop")}
          </Button>
        </div>
      ) : state === "review" && take ? (
        <div className="mt-4 space-y-3">
          <audio controls src={take.url} className="h-10 w-full" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onDone(take.file, take.seconds)}>
              {t("Yanıtıma ekle", "Add to my answer")}
            </Button>
            <Button variant="ghost" size="sm" onClick={retake}>
              <RotateCcw className="size-4" aria-hidden="true" /> {t("Yeniden kaydet", "Record again")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => void start()}>
            <Mic className="size-4" aria-hidden="true" /> {t("Kaydı başlat", "Start recording")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fileInput.current?.click()}>
            <Upload className="size-4" aria-hidden="true" /> {t("Ses dosyası seç", "Pick an audio file")}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="audio/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) onDone(file, null);
            }}
          />
        </div>
      )}

      {error ? <p className="mt-3 text-sm font-semibold text-[#8e2a20]">{error}</p> : null}
    </div>
  );
}
