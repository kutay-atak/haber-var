"use client";

import { UserMinus } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { deleteGroup, removeMember, setMemberRole, updateGroup } from "@/actions/groups";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Group, Member, MemberRole } from "@/lib/types";
import { useT } from "@/components/i18n";

export function GroupSettingsForm({ group }: { group: Group }) {
  const [state, action] = useActionState(updateGroup.bind(null, group.id), {});
  const t = useT();
  return (
    <form action={action} className="space-y-5">
      <Field label={t("Grubun adı", "Group name")} htmlFor="name">
        <Input id="name" name="name" required maxLength={60} defaultValue={group.name} />
      </Field>
      <Field label={t("Açıklama", "Description")} htmlFor="description">
        <Textarea id="description" name="description" maxLength={280} rows={3} defaultValue={group.description ?? ""} />
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <SubmitButton pendingText={t("Kaydediliyor…", "Saving…")}>{t("Kaydet", "Save")}</SubmitButton>
    </form>
  );
}

export function MemberManager({ groupId, members, myId }: { groupId: string; members: Member[]; myId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useT();

  function run(task: () => Promise<{ ok: boolean; error?: string }>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error ?? t("Bir şeyler ters gitti.", "Something went wrong."));
    });
  }

  return (
    <div className="space-y-3">
      {error ? <Alert tone="error">{error}</Alert> : null}
      <p className="rounded-2xl bg-sand/60 px-4 py-3 text-sm text-ink-soft">
        <strong className="text-ink">{t("Editör", "Editor")}:</strong>{" "}
        {t(
          "sıradaki sayı için soru önerebilir (havuzdan ya da kendi sorusu). Sayıyı yöneticiler başlatır.",
          "can suggest questions for the next issue (from the pool or their own). Admins still start the issue.",
        )}{" "}
        <strong className="text-ink">{t("Yönetici", "Admin")}:</strong>{" "}
        {t("grubu, sayıları ve tasarımı yönetir.", "manages the group, issues and design.")}
      </p>
      <ul className="divide-y divide-line">
        {members.map((m) => {
          const name = m.profiles?.display_name ?? t("Arkadaş", "Friend");
          const isMe = m.user_id === myId;
          return (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3">
              <Avatar name={name} src={m.profiles?.avatar_url} size="sm" />
              <span className="min-w-[9rem] flex-1 truncate font-semibold">
                {name}
                {isMe ? <span className="text-ink-soft"> ({t("sen", "you")})</span> : null}
              </span>
              {m.role === "admin" ? <Badge tone="sky">{t("Yönetici", "Admin")}</Badge> : null}
              {m.role === "editor" ? <Badge tone="sage">{t("Editör", "Editor")}</Badge> : null}
              <div className="flex items-center gap-1">
                <select
                  value={m.role}
                  disabled={pending}
                  aria-label={t(`${name} için rol`, `Role for ${name}`)}
                  onChange={(e) => run(() => setMemberRole(groupId, m.user_id, e.target.value as MemberRole))}
                  className="min-h-9 rounded-full border-2 border-line bg-white px-3 text-sm font-bold text-ink focus:border-terracotta focus:outline-none"
                >
                  <option value="member">{t("Üye", "Member")}</option>
                  <option value="editor">{t("Editör", "Editor")}</option>
                  <option value="admin">{t("Yönetici", "Admin")}</option>
                </select>
                {!isMe ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={pending}
                    className="text-[#8e2a20]"
                    onClick={() => run(() => removeMember(groupId, m.user_id), t(`${name} gruptan çıkarılsın mı?`, `Remove ${name} from the group?`))}
                  >
                    <UserMinus className="size-4" aria-hidden="true" /> {t("Çıkar", "Remove")}
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
  const t = useT();
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-ink-soft">
        {t(
          "Grup; tüm sayılar, yanıtlar, fotoğraflar ve videolarla birlikte kalıcı olarak silinir. Bu işlem geri alınamaz.",
          "The group is deleted permanently, along with all its issues, answers, photos and videos. This can't be undone.",
        )}
      </p>
      <Field
        label={
          <>
            {t("Onaylamak için grubun adını yaz:", "Type the group name to confirm:")} <strong>{groupName}</strong>
          </>
        }
        htmlFor="confirm"
      >
        <Input id="confirm" name="confirm" autoComplete="off" required />
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <SubmitButton
        variant="danger"
        pendingText={t("Siliniyor…", "Deleting…")}
        confirmMessage={t("Son kez soruyorum: grup silinsin mi?", "Last chance: delete the group?")}
      >
        {t("Grubu kalıcı olarak sil", "Delete group permanently")}
      </SubmitButton>
    </form>
  );
}
