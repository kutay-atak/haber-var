"use client";

import { Crown, UserMinus } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { deleteGroup, removeMember, setMemberRole, updateGroup } from "@/actions/groups";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Group, Member } from "@/lib/types";

export function GroupSettingsForm({ group }: { group: Group }) {
  const [state, action] = useActionState(updateGroup.bind(null, group.id), {});
  return (
    <form action={action} className="space-y-5">
      <Field label="Grubun adı" htmlFor="name">
        <Input id="name" name="name" required maxLength={60} defaultValue={group.name} />
      </Field>
      <Field label="Açıklama" htmlFor="description">
        <Textarea id="description" name="description" maxLength={280} rows={3} defaultValue={group.description ?? ""} />
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <SubmitButton pendingText="Kaydediliyor…">Kaydet</SubmitButton>
    </form>
  );
}

export function MemberManager({ groupId, members, myId }: { groupId: string; members: Member[]; myId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(task: () => Promise<{ ok: boolean; error?: string }>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error ?? "Bir şeyler ters gitti.");
    });
  }

  return (
    <div className="space-y-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <ul className="divide-y divide-line">
        {members.map((m) => {
          const name = m.profiles?.display_name ?? "Arkadaş";
          const isMe = m.user_id === myId;
          return (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar name={name} src={m.profiles?.avatar_url} size="sm" />
              <span className="min-w-0 flex-1 truncate font-semibold">
                {name}
                {isMe ? <span className="text-ink-soft"> (sen)</span> : null}
              </span>
              {m.role === "admin" ? <Badge tone="sky">Yönetici</Badge> : null}
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => setMemberRole(groupId, m.user_id, m.role === "admin" ? "member" : "admin"))}
                >
                  <Crown className="size-4" aria-hidden="true" />
                  {m.role === "admin" ? "Yöneticilikten al" : "Yönetici yap"}
                </Button>
                {!isMe ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    className="text-[#8e2a20]"
                    onClick={() => run(() => removeMember(groupId, m.user_id), `${name} gruptan çıkarılsın mı?`)}
                  >
                    <UserMinus className="size-4" aria-hidden="true" /> Çıkar
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DeleteGroupForm({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [state, action] = useActionState(deleteGroup.bind(null, groupId), {});
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-ink-soft">
        Grup; tüm sayılar, yanıtlar, fotoğraflar ve videolarla birlikte kalıcı olarak silinir. Bu işlem geri alınamaz.
      </p>
      <Field label={<>Onaylamak için grubun adını yaz: <strong>{groupName}</strong></>} htmlFor="confirm">
        <Input id="confirm" name="confirm" autoComplete="off" required />
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <SubmitButton variant="danger" pendingText="Siliniyor…" confirmMessage="Son kez soruyorum: grup silinsin mi?">
        Grubu kalıcı olarak sil
      </SubmitButton>
    </form>
  );
}
