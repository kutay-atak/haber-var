"use client";

import { useActionState } from "react";
import { createGroup } from "@/actions/groups";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateGroupForm() {
  const [state, action] = useActionState(createGroup, {});
  return (
    <form action={action} className="space-y-5">
      <Field label="Grubun adı" htmlFor="name" hint="Ör. Kuzenler, Lise Tayfası, Erasmus'tan Kalanlar">
        <Input id="name" name="name" required maxLength={60} placeholder="Kuzenler Şubesi" autoFocus />
      </Field>
      <Field label="Kısa açıklama (isteğe bağlı)" htmlFor="description">
        <Textarea
          id="description"
          name="description"
          maxLength={280}
          rows={3}
          placeholder="Dünyanın dört bir yanına dağılmış kuzenlerin aylık gazetesi."
        />
      </Field>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Kuruluyor…">
        Grubu kur 🎉
      </SubmitButton>
    </form>
  );
}
