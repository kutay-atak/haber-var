// Otomatik tekrarlayan sayılar: tarih hesapları burada, sayıyı açan iş aşağıda.
// Zamanlanmış iş (vercel.json) her gün 07:00 UTC'de (Türkiye saatiyle 10:00) çalışır.
import type { IssueSchedule, ScheduleFrequency } from "@/lib/types";

/** Planlanan günün 06:00 UTC'si: o sabahki zamanlanmış iş sayıyı açar. */
const RUN_HOUR_UTC = 6;
/** Son teslim, son günün 17:00 UTC'si (Türkiye saatiyle 20:00). */
const DEADLINE_HOUR_UTC = 17;
const DAY = 24 * 60 * 60 * 1000;

/** Sıklığa göre en uzun süre: sayılar birbirinin üstüne binmesin. */
export const MAX_DURATION: Record<ScheduleFrequency, number> = { weekly: 6, biweekly: 13, monthly: 21 };

type Rule = Pick<IssueSchedule, "frequency" | "weekday" | "month_day">;

const atRunHour = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d, RUN_HOUR_UTC));
/** 1 = Pazartesi … 7 = Pazar */
const isoWeekday = (date: Date) => ((date.getUTCDay() + 6) % 7) + 1;

/** Kurala uyan, `after` anından sonraki ilk planlı an. */
export function nextRunAfter(rule: Rule, after: Date): Date {
  if (rule.frequency === "monthly") {
    const day = rule.month_day ?? 1;
    let candidate = atRunHour(after.getUTCFullYear(), after.getUTCMonth(), day);
    if (candidate <= after) candidate = atRunHour(after.getUTCFullYear(), after.getUTCMonth() + 1, day);
    return candidate;
  }
  let candidate = atRunHour(after.getUTCFullYear(), after.getUTCMonth(), after.getUTCDate());
  while (candidate <= after || isoWeekday(candidate) !== (rule.weekday ?? 1)) candidate = new Date(candidate.getTime() + DAY);
  return candidate;
}

/** Bir sayı açıldıktan sonraki planlı an. İki haftada birde düzen bozulmasın diye planlanan andan sayılır. */
export function nextRunAfterRun(rule: Rule & Pick<IssueSchedule, "next_run_at">, now: Date): Date {
  if (rule.frequency !== "biweekly") return nextRunAfter(rule, now);
  let next = new Date(new Date(rule.next_run_at).getTime() + 14 * DAY);
  while (next <= now) next = new Date(next.getTime() + 14 * DAY);
  return next;
}

/** Sayının son teslimi: açıldığı günden `durationDays` gün sonra, akşam 20:00 (Türkiye). */
export function scheduledDeadline(openedAt: Date, durationDays: number): Date {
  const d = new Date(Date.UTC(openedAt.getUTCFullYear(), openedAt.getUTCMonth(), openedAt.getUTCDate(), DEADLINE_HOUR_UTC));
  return new Date(d.getTime() + durationDays * DAY);
}
