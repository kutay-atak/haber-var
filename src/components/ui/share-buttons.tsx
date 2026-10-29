"use client";

import { MessageCircle, Send, Share2 } from "lucide-react";
import { buttonClasses } from "./button";
import { CopyButton } from "./copy-button";
import { useIsClient } from "./client-time";

/** Linki kopyala + WhatsApp + Telegram (+ telefonda yerel paylaşım menüsü). */
export function ShareButtons({ url, message, size = "md" }: { url: string; message: string; size?: "sm" | "md" }) {
  const isClient = useIsClient();
  const canNativeShare = isClient && typeof navigator.share === "function";
  const full = `${message} ${url}`;

  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton text={url} size={size} />
      <a
        className={buttonClasses({ variant: "secondary", size })}
        href={`https://wa.me/?text=${encodeURIComponent(full)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle className="size-4 text-[#1f9d55]" aria-hidden="true" />
        WhatsApp
      </a>
      <a
        className={buttonClasses({ variant: "secondary", size })}
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Send className="size-4 text-[#2a8bd0]" aria-hidden="true" />
        Telegram
      </a>
      {canNativeShare ? (
        <button
          type="button"
          className={buttonClasses({ variant: "secondary", size })}
          onClick={() => navigator.share({ text: message, url }).catch(() => {})}
        >
          <Share2 className="size-4" aria-hidden="true" />
          Paylaş
        </button>
      ) : null}
    </div>
  );
}
