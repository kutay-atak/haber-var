"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile, email }: { profile: Profile; email: string | null }) {
  const [state, action] = useActionState(updateProfile, {});
  return (
    <form action={action} className="space-y-5">
      <Field label="Adın" htmlFor="display_name" hint="Gazetede yazılarının altında bu isim görünür.">
        <Input id="display_name" name="display_name" required maxLength={60} defaultValue={profile.display_name} />
      </Field>
      {email ? (
        <Field label="E-posta" htmlFor="email">
          <Input id="email" value={email} disabled readOnly />
        </Field>
      ) : null}
      <label className="flex items-start gap-3 rounded-2xl bg-sand/60 p-4">
        <input
          type="checkbox"
          name="email_opt_in"
          defaultChecked={profile.email_opt_in}
          className="mt-1 size-5 accent-[#b4523a]"
        />
        <span>
          <span className="block font-bold">E-posta bildirimleri</span>
          <span className="text-sm text-ink-soft">
            Yeni sayı başladığında, süre bitmek üzereyken (henüz yazmadıysan) ve gazete yayımlandığında haber ver.
          </span>
        </span>
      </label>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <SubmitButton pendingText="Kaydediliyor…">Kaydet</SubmitButton>
    </form>
  );
}
