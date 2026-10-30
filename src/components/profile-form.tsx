"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/profile";
import { Alert } from "@/components/ui/alert";
import { Field, Input } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Profile } from "@/lib/types";
import { useT } from "@/components/i18n";

export function ProfileForm({ profile, email }: { profile: Profile; email: string | null }) {
  const [state, action] = useActionState(updateProfile, {});
  const t = useT();
  return (
    <form action={action} className="space-y-5">
      <Field
        label={t("Adın", "Your name")}
        htmlFor="display_name"
        hint={t("Gazetede yazılarının altında bu isim görünür.", "This name appears under your stories in the newspaper.")}
      >
        <Input id="display_name" name="display_name" required maxLength={60} defaultValue={profile.display_name} />
      </Field>
      {email ? (
        <Field label={t("E-posta", "Email")} htmlFor="email">
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
          <span className="block font-bold">{t("E-posta bildirimleri", "Email notifications")}</span>
          <span className="text-sm text-ink-soft">
            {t(
              "Yeni sayı başladığında, süre bitmek üzereyken (henüz yazmadıysan) ve gazete yayımlandığında haber ver.",
              "Let me know when a new issue starts, when time is almost up (if I haven't written yet) and when the newspaper is published.",
            )}
          </span>
        </span>
      </label>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <SubmitButton pendingText={t("Kaydediliyor…", "Saving…")}>{t("Kaydet", "Save")}</SubmitButton>
    </form>
  );
}
