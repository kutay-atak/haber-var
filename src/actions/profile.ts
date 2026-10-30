"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const t = await getT();
  const parsed = z
    .object({
      displayName: z
        .string()
        .trim()
        .min(1, { error: t("Adın boş olamaz.", "Your name can't be empty.") })
        .max(60, { error: t("Ad en fazla 60 karakter olabilir.", "The name can be at most 60 characters.") }),
    })
    .safeParse({ displayName: formData.get("display_name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName, email_opt_in: formData.get("email_opt_in") === "on" })
    .eq("id", user.id);
  if (error) return { error: dbErrorMessage(error, t) };
  revalidatePath("/", "layout");
  return { success: t("Profilin güncellendi.", "Your profile has been updated.") };
}
