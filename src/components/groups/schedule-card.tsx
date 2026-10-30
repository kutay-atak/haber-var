"use client";

import { CalendarClock, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteSchedule, saveSchedule } from "@/actions/schedules";
import { useLocale, useT } from "@/components/i18n";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { INTL_LOCALE } from "@/lib/i18n";
import { MAX_DURATION } from "@/lib/schedules";
import type { IssueSchedule, ScheduleFrequency } from "@/lib/types";
import { cn } from "@/lib/utils";

const selectClass =
  "min-h-10 rounded-xl border-2 border-line bg-white px-3 font-semibold text-ink focus:border-terracotta focus:outline-none focus:ring-4 focus:ring-terracotta/15";

/** Otomatik tekrarlayan sayılar: "her ayın 1'inde, 7 gün süreyle, 4 soru". */
export function ScheduleCard({ groupId, schedule }: { groupId: string; schedule: IssueSchedule | null }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [enabled, setEnabled] = useState(schedule?.enabled ?? true);
  const [frequency, setFrequency] = useState<ScheduleFrequency>(schedule?.frequency ?? "monthly");
  const [weekday, setWeekday] = useState(schedule?.weekday ?? 1);
  const [monthDay, setMonthDay] = useState(schedule?.month_day ?? 1);
  const [durationDays, setDurationDays] = useState(schedule?.duration_days ?? 7);
  const [questionCount, setQuestionCount] = useState(schedule?.question_count ?? 4);
  const [nextRunAt, setNextRunAt] = useState(schedule?.next_run_at ?? null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const maxDays = MAX_DURATION[frequency];
  const days = Math.min(durationDays, maxDays);
  // 2026-11-02 bir Pazartesi: haftanın günlerinin adlarını seçili dilde üretmek için.
  const weekdayName = (n: number) =>
    new Intl.DateTimeFormat(INTL_LOCALE[locale], { weekday: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, 10, 1 + n)));

  function save() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveSchedule(groupId, { enabled, frequency, weekday, monthDay, durationDays: days, questionCount });
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setNextRunAt(result.nextRunAt);
      setMessage({ tone: "success", text: t("Kaydedildi! Sayılar artık kendiliğinden başlayacak. 🎉", "Saved! Issues will now start on their own. 🎉") });
      router.refresh();
    });
  }

  function turnOff() {
    if (!window.confirm(t("Otomatik sayılar kapatılsın mı?", "Turn off automatic issues?"))) return;
    setMessage(null);
    startTransition(async () => {
      const result = await deleteSchedule(groupId);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setNextRunAt(null);
      setMessage({ tone: "success", text: t("Otomatik sayılar kapatıldı.", "Automatic issues are off.") });
      router.refresh();
    });
  }

  const frequencies: Array<{ value: ScheduleFrequency; label: string }> = [
    { value: "weekly", label: t("Her hafta", "Every week") },
    { value: "biweekly", label: t("İki haftada bir", "Every two weeks") },
    { value: "monthly", label: t("Her ay", "Every month") },
  ];

  return (
    <div className="space-y-5">
      <p className="text-ink-soft">
        {t(
          "Sayılar senin yerine kendiliğinden başlasın. Sorular önce editörlerin sırasından, kalan yerler soru havuzundan rastgele gelir (bu grupta daha önce sorulmamışlar öncelikli, en fazla bir anket ve bir \"kim daha çok?\").",
          "Let issues start on their own. Questions come from the editors' queue first; the rest are picked at random from the pool (ones this group hasn't had yet first, at most one poll and one \"most likely to\").",
        )}
      </p>

      <label className="flex items-center gap-3 font-bold">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-5 accent-[#b4523a]" />
        {t("Otomatik sayılar açık", "Automatic issues on")}
      </label>

      <fieldset className={cn("space-y-4", !enabled && "opacity-50")} disabled={!enabled}>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("Sıklık", "Frequency")}>
          {frequencies.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={frequency === f.value}
              onClick={() => setFrequency(f.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                frequency === f.value ? "bg-ink text-white" : "bg-sand text-ink-soft hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1.5 text-sm font-bold">
            <span className="block">{frequency === "monthly" ? t("Ayın kaçında?", "Day of the month") : t("Hangi gün?", "Which day?")}</span>
            {frequency === "monthly" ? (
              <select className={cn(selectClass, "w-full")} value={monthDay} onChange={(e) => setMonthDay(Number(e.target.value))}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            ) : (
              <select className={cn(selectClass, "w-full")} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d}>
                    {weekdayName(d)}
                  </option>
                ))}
              </select>
            )}
          </label>
          <label className="space-y-1.5 text-sm font-bold">
            <span className="block">{t("Kaç gün açık kalsın?", "Open for how many days?")}</span>
            <select className={cn(selectClass, "w-full")} value={days} onChange={(e) => setDurationDays(Number(e.target.value))}>
              {Array.from({ length: maxDays - 1 }, (_, i) => i + 2).map((d) => (
                <option key={d} value={d}>
                  {t(`${d} gün`, `${d} days`)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-sm font-bold">
            <span className="block">{t("Kaç soru?", "How many questions?")}</span>
            <select className={cn(selectClass, "w-full")} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      {nextRunAt && enabled ? (
        <p className="flex flex-wrap items-center gap-2 rounded-2xl bg-sage-soft px-4 py-3 text-sm font-semibold text-sage-deep">
          <CalendarClock className="size-4" aria-hidden="true" />
          {t("Sıradaki otomatik sayı:", "Next automatic issue:")} <strong>{formatDate(nextRunAt, locale)}</strong>
          <span className="font-normal">{t("(sabah 10:00 civarı, Türkiye saati)", "(around 10:00 in the morning, Turkey time)")}</span>
        </p>
      ) : null}

      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={pending}>
          <Repeat className="size-4" aria-hidden="true" /> {pending ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}
        </Button>
        {schedule ? (
          <Button variant="ghost" onClick={turnOff} disabled={pending} className="text-[#8e2a20]">
            {t("Tamamen kapat", "Turn off completely")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
