"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { FormState } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z
    .object({
      displayName: z
        .string()
        .trim()
        .min(1, { error: "Adın boş olamaz." })
        .max(60, { error: "Ad en fazla 60 karakter olabilir." }),
    })
    .safeParse({ displayName: formData.get("display_name") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName, email_opt_in: formData.get("email_opt_in") === "on" })
    .eq("id", user.id);
  if (error) return { error: dbErrorMessage(error) };
  revalidatePath("/", "layout");
  return { success: "Profilin güncellendi." };
}
