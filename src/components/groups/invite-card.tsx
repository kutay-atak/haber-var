"use client";

import { RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { regenerateInvite } from "@/actions/groups";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShareButtons } from "@/components/ui/share-buttons";
import { useT } from "@/components/i18n";

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
  const t = useT();
  const url = current ? `${baseUrl}/davet/${current}` : "";

  function regenerate() {
    if (!window.confirm(t("Eski davet linki çalışmaz hâle gelecek. Yeni link oluşturulsun mu?", "The old invite link will stop working. Create a new link?"))) return;
    setError(null);
    startTransition(async () => {
      const result = await regenerateInvite(groupId);
      if (result.ok && result.token) setCurrent(result.token);
      else setError(result.error ?? t("Yeni link oluşturulamadı.", "Couldn't create a new link."));
    });
  }

  return (
    <section
      className={`rounded-[1.75rem] border p-5 sm:p-6 ${
        highlight ? "border-terracotta/40 bg-terracotta-soft/60 shadow-lift" : "border-line/80 bg-paper shadow-soft"
      }`}
    >
      <h2 className="text-xl font-semibold">{t("Arkadaşlarını davet et", "Invite your friends")}</h2>
      <p className="mt-1 text-sm text-ink-soft">
        {t(
          "Bu linki WhatsApp, Discord ya da istediğin yerde paylaş. Linke tıklayan herkes gruba katılabilir.",
          "Share this link on WhatsApp, Discord or anywhere you like. Anyone who opens it can join the group.",
        )}
      </p>
      {current ? (
        <>
          <p className="mt-4 break-all rounded-2xl border-2 border-dashed border-line bg-white px-4 py-3 font-mono text-sm">
            {url}
          </p>
          <div className="mt-4">
            <ShareButtons url={url} message={t(`"${groupName}" grubunun gazetesine katıl:`, `Join the "${groupName}" newspaper:`)} size="sm" />
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm font-semibold text-ink-soft">{t("Aktif bir davet linki yok.", "There's no active invite link.")}</p>
      )}
      {error ? (
        <Alert tone="error" className="mt-3">
          {error}
        </Alert>
      ) : null}
      <Button variant="ghost" size="sm" className="mt-3 -ml-3" onClick={regenerate} disabled={pending}>
        <RefreshCw className={`size-4 ${pending ? "animate-spin" : ""}`} aria-hidden="true" />
        {current ? t("Yeni link oluştur", "Create new link") : t("Link oluştur", "Create link")}
      </Button>
    </section>
  );
}
