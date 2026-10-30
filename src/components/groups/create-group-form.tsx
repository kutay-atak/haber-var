"use client";

import { useActionState } from "react";
import { createGroup } from "@/actions/groups";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/components/i18n";

export function CreateGroupForm() {
  const [state, action] = useActionState(createGroup, {});
  const t = useT();
  return (
    <form action={action} className="space-y-5">
      <Field
        label={t("Grubun adı", "Group name")}
        htmlFor="name"
        hint={t("Ör. Kuzenler, Lise Tayfası, Erasmus'tan Kalanlar", "E.g. The Cousins, High School Crew, Erasmus Gang")}
      >
        <Input id="name" name="name" required maxLength={60} placeholder={t("Kuzenler Şubesi", "The Cousins Club")} autoFocus />
      </Field>
      <Field label={t("Kısa açıklama (isteğe bağlı)", "Short description (optional)")} htmlFor="description">
        <Textarea
          id="description"
          name="description"
          maxLength={280}
          rows={3}
          placeholder={t(
            "Dünyanın dört bir yanına dağılmış kuzenlerin aylık gazetesi.",
            "The monthly paper of cousins scattered around the world.",
          )}
        />
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText={t("Kuruluyor…", "Creating…")}>
        {t("Grubu kur", "Create group")} 🎉
      </SubmitButton>
    </form>
  );
}
