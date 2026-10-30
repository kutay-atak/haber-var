// Soru tipleri (yazılı, anket, "kim daha çok?") için ortak kurallar.
// Hem sayı formu hem editörlerin soru önerileri hem de otomatik sayılar bunları kullanır.
import { z } from "zod";
import type { T } from "@/lib/i18n";
import type { QuestionKind } from "@/lib/types";

export const QUESTION_KINDS: readonly QuestionKind[] = ["text", "poll", "who"];
export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 6;

/** Sorunun metni, tipi ve (ankette) seçenekleri. */
export function questionFields(t: T) {
  return {
    text: z
      .string()
      .trim()
      .min(3, { error: t("Soru çok kısa.", "The question is too short.") })
      .max(300, { error: t("Bir soru en fazla 300 karakter olabilir.", "A question can be at most 300 characters.") }),
    kind: z.enum(["text", "poll", "who"]).default("text"),
    options: z
      .array(
        z
          .string()
          .trim()
          .min(1, { error: t("Boş seçenek olamaz.", "Options can't be empty.") })
          .max(80, { error: t("Bir seçenek en fazla 80 karakter olabilir.", "An option can be at most 80 characters.") }),
      )
      .max(POLL_MAX_OPTIONS, { error: t("Bir ankette en fazla 6 seçenek olabilir.", "A poll can have at most 6 options.") })
      .nullable()
      .optional(),
  };
}

/** Ankette en az 2 seçenek olmalı; diğer tiplerde seçenek tutulmaz. */
export function withPollRules<S extends z.ZodType<{ kind: QuestionKind; options?: string[] | null }>>(schema: S, t: T) {
  return schema
    .refine((q) => q.kind !== "poll" || (q.options?.length ?? 0) >= POLL_MIN_OPTIONS, {
      error: t("Bir ankette en az 2 seçenek olmalı.", "A poll needs at least 2 options."),
      path: ["options"],
    })
    .transform((q) => ({ ...q, options: q.kind === "poll" ? (q.options ?? null) : null }));
}

export function questionSchema(t: T) {
  return withPollRules(z.object(questionFields(t)), t);
}
