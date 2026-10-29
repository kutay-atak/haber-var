"use client";

import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { regenerateInvite } from "@/actions/groups";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ui/share-buttons";

export function InviteCard({
  groupId,
  groupName,
  token,
  baseUrl,
  highlight = false,
}: {
  groupId: string;
  groupName: string;
  token: string | null;
  baseUrl: string;
  highlight?: boolean;
}) {
  const [current, setCurrent] = useState(token);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const url = current ? `${baseUrl}/davet/${current}` : "";

  function regenerate() {
    if (!window.confirm("Eski davet linki çalışmaz hâle gelecek. Yeni link oluşturulsun mu?")) return;
    setError(null);
    startTransition(async () => {
      const result = await regenerateInvite(groupId);
      if (result.ok && result.token) setCurrent(result.token);
      else setError(result.error ?? "Yeni link oluşturulamadı.");
    });
  }

  return (
    <section
      className={`rounded-[1.75rem] border p-5 sm:p-6 ${
        highlight ? "border-terracotta/40 bg-terracotta-soft/60 shadow-lift" : "border-line/80 bg-paper shadow-soft"
      }`}
    >
      <h2 className="text-xl font-semibold">Arkadaşlarını davet et 💌</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Bu linki WhatsApp, Discord ya da istediğin yerde paylaş. Linke tıklayan herkes gruba katılabilir.
      </p>
      {current ? (
        <>
          <p className="mt-4 break-all rounded-2xl border-2 border-dashed border-line bg-white px-4 py-3 font-mono text-sm">
            {url}
          </p>
          <div className="mt-4">
            <ShareButtons url={url} message={`"${groupName}" grubunun gazetesine katıl! 📰`} size="sm" />
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm font-semibold text-ink-soft">Aktif bir davet linki yok.</p>
      )}
      {error ? (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      ) : null}
      <Button variant="ghost" size="sm" className="mt-3 -ml-3" onClick={regenerate} disabled={pending}>
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />
        {current ? "Yeni link oluştur" : "Link oluştur"}
      </Button>
    </section>
  );
}
