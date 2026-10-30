"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/errors";
import { getLocale, getT } from "@/lib/i18n-server";
import { MAX_DURATION, nextRunAfter } from "@/lib/schedules";
import { createClient } from "@/lib/supabase/server";
import type { ScheduleFrequency } from "@/lib/types";
import { isUuid } from "@/lib/utils";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export interface ScheduleInput {
  enabled: boolean;
  frequency: ScheduleFrequency;
  weekday: number;
  monthDay: number;
  durationDays: number;
  questionCount: number;
}

/** Otomatik tekrarlayan sayı kuralını kaydeder (yalnızca yöneticiler). */
export async function saveSchedule(groupId: string, input: ScheduleInput): Promise<Result<{ nextRunAt: string }>> {
  const user = await requireUser();
  const t = await getT();
  if (!isUuid(groupId)) return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  const parsed = z
    .object({
      enabled: z.boolean(),
      frequency: z.enum(["weekly", "biweekly", "monthly"]),
      weekday: z.number().int().min(1).max(7),
      monthDay: z.number().int().min(1).max(28),
      durationDays: z.number().int().min(2),
      questionCount: z.number().int().min(1).max(10),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: t("Ayarları kontrol et.", "Check the settings.") };
  const s = parsed.data;
  const maxDays = MAX_DURATION[s.frequency];
  if (s.durationDays > maxDays) {
    return {
      ok: false,
      error: t(
        `Bu sıklıkta bir sayı en fazla ${maxDays} gün açık kalabilir; yoksa sayılar üst üste biner.`,
        `At this frequency an issue can stay open for at most ${maxDays} days, otherwise issues would overlap.`,
      ),
    };
  }

  const rule = { frequency: s.frequency, weekday: s.weekday, month_day: s.monthDay };
  const nextRunAt = nextRunAfter(rule, new Date()).toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("issue_schedules").upsert(
    {
      group_id: groupId,
      enabled: s.enabled,
      frequency: s.frequency,
      weekday: s.frequency === "monthly" ? null : s.weekday,
      month_day: s.frequency === "monthly" ? s.monthDay : null,
      duration_days: s.durationDays,
      question_count: s.questionCount,
      locale: await getLocale(),
      next_run_at: nextRunAt,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "group_id" },
  );
  if (error) {
    if (error.code === "42501") return { ok: false, error: t("Bunu sadece grup yöneticileri yapabilir.", "Only group admins can do this.") };
    return { ok: false, error: dbErrorMessage(error, t) };
  }
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true, nextRunAt };
}

/** Otomatik sayıları tamamen kapatır. */
export async function deleteSchedule(groupId: string): Promise<Result> {
  await requireUser();
  const t = await getT();
  if (!isUuid(groupId)) return { ok: false, error: t("Geçersiz istek.", "Invalid request.") };
  const supabase = await createClient();
  const { error } = await supabase.from("issue_schedules").delete().eq("group_id", groupId);
  if (error) return { ok: false, error: dbErrorMessage(error, t) };
  revalidatePath(`/gruplar/${groupId}`, "layout");
  return { ok: true };
}
