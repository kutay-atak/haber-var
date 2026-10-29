"use client";

import { CalendarClock, Megaphone, Rocket, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteIssue, publishIssueNow, startIssue, updateIssueSettings } from "@/actions/issues";
import { TemplatePicker } from "@/components/issues/template-picker";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/components/ui/client-time";
import { Input } from "@/components/ui/field";
import type { TemplateId } from "@/lib/types";

type Result = { ok: boolean; error?: string } | undefined;

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function run(task: () => Promise<Result>, opts: { confirm?: string; success?: string } = {}) {
    if (opts.confirm && !window.confirm(opts.confirm)) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await task();
      if (result && !result.ok) {
        setError(result.error ?? "Bir şeyler ters gitti.");
        return;
      }
      if (opts.success) setSuccess(opts.success);
      router.refresh();
    });
  }
  return { run, pending, error, success };
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Açık sayı için: süreyi uzat, erken yayımla, sil. */
export function OpenIssueAdminControls({ issueId, deadlineAt }: { issueId: string; deadlineAt: string }) {
  const { run, pending, error, success } = useAction();
  const isClient = useIsClient();
  const [value, setValue] = useState<string | null>(null);
  const shown = value ?? (isClient ? toLocalInput(deadlineAt) : "");

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="new-deadline" className="flex items-center gap-1.5 text-sm font-bold">
          <CalendarClock className="size-4" aria-hidden="true" /> Son teslim tarihini değiştir
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input id="new-deadline" type="datetime-local" className="w-auto" value={shown} onChange={(e) => setValue(e.target.value)} />
          <Button
            variant="secondary"
            disabled={pending || !value}
            onClick={() =>
              run(() => updateIssueSettings(issueId, { deadlineAt: new Date(value!).toISOString() }), { success: "Tarih güncellendi." })
            }
          >
            Kaydet
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-t border-line pt-4">
        <Button
          variant="sage"
          disabled={pending}
          onClick={() =>
            run(() => publishIssueNow(issueId), {
              confirm: "Süreyi beklemeden gazete şimdi yayımlansın mı? Sonrasında kimse yanıt ekleyemez.",
            })
          }
        >
          <Megaphone className="size-4" aria-hidden="true" /> Şimdi yayımla
        </Button>
        <Button
          variant="danger"
          disabled={pending}
          onClick={() =>
            run(() => deleteIssue(issueId), { confirm: "Bu sayı ve içindeki tüm yanıtlar kalıcı olarak silinsin mi?" })
          }
        >
          <Trash2 className="size-4" aria-hidden="true" /> Sayıyı sil
        </Button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}
    </div>
  );
}

/** Taslak sayı için: başlat ya da sil. */
export function DraftIssueAdminControls({ issueId }: { issueId: string }) {
  const { run, pending, error } = useAction();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button
          size="lg"
          disabled={pending}
          onClick={() => run(() => startIssue(issueId), { confirm: "Sayı başlasın mı? Grubundaki herkese e-posta gidecek." })}
        >
          <Rocket className="size-5" aria-hidden="true" /> Sayıyı başlat
        </Button>
        <Button
          variant="danger"
          size="lg"
          disabled={pending}
          onClick={() => run(() => deleteIssue(issueId), { confirm: "Bu taslak silinsin mi?" })}
        >
          <Trash2 className="size-5" aria-hidden="true" /> Taslağı sil
        </Button>
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}

/** Yayımlanmış sayının varsayılan şablonunu değiştir. */
export function TemplateAdminControl({ issueId, template }: { issueId: string; template: TemplateId }) {
  const { run, pending, error, success } = useAction();
  return (
    <div className="space-y-3" aria-busy={pending}>
      <TemplatePicker
        name="issue-template"
        value={template}
        onChange={(next) => run(() => updateIssueSettings(issueId, { template: next }), { success: "Varsayılan şablon güncellendi." })}
      />
      {error ? <Alert tone="error">{error}</Alert> : null}
      {success ? <Alert tone="success">{success}</Alert> : null}
    </div>
  );
}
