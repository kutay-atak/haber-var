"use client";

import { CalendarClock, Megaphone, Rocket, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteIssue, publishIssueNow, startIssue, updateIssueSettings } from "@/actions/issues";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/components/ui/client-time";
import { Input } from "@/components/ui/field";
import { useT } from "@/components/i18n";

type Result = { ok: boolean; error?: string } | undefined;

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const t = useT();

  function run(task: () => Promise<Result>, opts: { confirm?: string; success?: string } = {}) {
    if (opts.confirm && !window.confirm(opts.confirm)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await task();
      if (result && !result.ok) {
        setError(result.error ?? t("Bir şeyler ters gitti.", "Something went wrong."));
        return;
      }
      if (opts.success) setSuccess(opts.success);
      router.refresh();
    });
  }
  return { run, pending, error, success, t };
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Açık sayı için: süreyi uzat, erken yayımla, sil. */
export function OpenIssueAdminControls({ issueId, deadlineAt }: { issueId: string; deadlineAt: string }) {
  const { run, pending, error, success, t } = useAction();
  const isClient = useIsClient();
  const [value, setValue] = useState<string | null>(null);
  const shown = value ?? (isClient ? toLocalInput(deadlineAt) : "");

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="new-deadline" className="flex items-center gap-1.5 text-sm font-bold">
          <CalendarClock className="size-4" aria-hidden="true" /> {t("Son teslim tarihini değiştir", "Change the deadline")}
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input id="new-deadline" type="datetime-local" className="w-auto" value={shown} onChange={(e) => setValue(e.target.value)} />
          <Button
            variant="secondary"
            disabled={pending || !value}
            onClick={() =>
              run(() => updateIssueSettings(issueId, { deadlineAt: new Date(value!).toISOString() }), { success: t("Tarih güncellendi.", "Deadline updated.") })
            }
          >
            {t("Kaydet", "Save")}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button
          variant="sage"
          disabled={pending}
          onClick={() =>
            run(() => publishIssueNow(issueId), {
              confirm: t(
                "Süreyi beklemeden gazete şimdi yayımlansın mı? Sonrasında kimse yanıt ekleyemez.",
                "Publish the newspaper now without waiting for the deadline? Nobody will be able to add answers afterwards.",
              ),
            })
          }
        >
          <Megaphone className="size-4" aria-hidden="true" /> {t("Şimdi yayımla", "Publish now")}
        </Button>
        <Button
          variant="danger"
          disabled={pending}
          onClick={() =>
            run(() => deleteIssue(issueId), {
              confirm: t(
                "Bu sayı ve içindeki tüm yanıtlar kalıcı olarak silinsin mi?",
                "Permanently delete this issue and all the answers in it?",
              ),
            })
          }
        >
          <Trash2 className="size-4" aria-hidden="true" /> {t("Sayıyı sil", "Delete issue")}
        </Button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}
    </div>
  );
}

/** Taslak sayı için: başlat ya da sil. */
export function DraftIssueAdminControls({ issueId }: { issueId: string }) {
  const { run, pending, error, t } = useAction();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          disabled={pending}
          onClick={() => run(() => startIssue(issueId), { confirm: t("Sayı başlasın mı? Grubundaki herkese e-posta gidecek.", "Start the issue? Everyone in your group will get an email.") })}
        >
          <Rocket className="size-5" aria-hidden="true" /> {t("Sayıyı başlat", "Start the issue")}
        </Button>
        <Button
          variant="danger"
          size="lg"
          disabled={pending}
          onClick={() => run(() => deleteIssue(issueId), { confirm: t("Bu taslak silinsin mi?", "Delete this draft?") })}
        >
          <Trash2 className="size-5" aria-hidden="true" /> {t("Taslağı sil", "Delete draft")}
        </Button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
