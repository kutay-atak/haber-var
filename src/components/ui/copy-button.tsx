"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { useT } from "@/components/i18n";

export function CopyButton({
  text,
  label,
  variant = "secondary",
  size = "md",
  className,
}: {
  text: string;
  label?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Eski tarayıcılar için yedek yöntem
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant={variant} size={size} onClick={copy} className={className} aria-live="polite">
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
      {copied ? t("Kopyalandı!", "Copied!") : (label ?? t("Linki kopyala", "Copy link"))}
    </Button>
  );
}
