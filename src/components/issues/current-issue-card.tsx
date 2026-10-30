import { CalendarClock, PenLine, Rocket } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Countdown, LocalDateTime } from "@/components/ui/client-time";
import type { IssueSummary } from "@/lib/data/groups";
import type { Member } from "@/lib/types";
import { getT } from "@/lib/i18n-server";

export async function CurrentIssueCard({
  issue,
  members,
  writerIds,
  myId,
  now,
}: {
  issue: IssueSummary;
  members: Member[];
  writerIds: string[];
  myId: string;
  now: number;
}) {
  const writers = members.filter((m) => writerIds.includes(m.user_id));
  const iWrote = writerIds.includes(myId);
  const ratio = members.length ? writers.length / members.length : 0;
  const t = await getT();

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-sage/40 bg-gradient-to-br from-sage-soft via-paper to-mustard-soft p-6 shadow-lift sm:p-8">
      <div aria-hidden="true" className="absolute -right-6 -top-6 size-32 rotate-12 rounded-[2rem] bg-sage/20" />
      <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-widest text-sage-deep">
        <span className="size-2 animate-pulse rounded-full bg-sage" aria-hidden="true" /> {t("Şu an açık", "Open now")}
      </p>
      <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
        {t("Sayı", "Issue")} {issue.number}
        {issue.title ? <span className="text-ink-soft"> · {issue.title}</span> : null}
      </h2>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold text-ink-soft">
        <CalendarClock className="size-4" aria-hidden="true" />
        {t("Son teslim", "Deadline")} <LocalDateTime iso={issue.deadline_at} className="text-ink" /> ·{" "}
        <span className="text-terracotta-deep">
          <Countdown iso={issue.deadline_at} serverNow={now} />
        </span>
      </p>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>
            {writers.length}/{members.length} {t("kişi yazdı", "have written")}
          </span>
          {writers.length ? <AvatarStack size="xs" people={writers.map((w) => ({ name: w.profiles?.display_name ?? t("Arkadaş", "Friend"), src: w.profiles?.avatar_url }))} /> : null}
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/80" role="progressbar" aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-sage transition-[width] duration-700" style={{ width: `${Math.max(ratio * 100, 3)}%` }} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink href={`/sayi/${issue.id}`} size="lg" variant={iWrote ? "secondary" : "primary"}>
          {iWrote ? (
            <>
              <PenLine className="size-5" aria-hidden="true" /> {t("Yanıtlarımı düzenle", "Edit my answers")}
            </>
          ) : (
            <>
              <Rocket className="size-5" aria-hidden="true" /> {t("Yanıtlarını yaz", "Write your answers")}
            </>
          )}
        </ButtonLink>
        {iWrote ? <span className="font-hand text-2xl text-sage-deep">{t("Senin köşen hazır", "Your corner is ready")} ✓</span> : null}
      </div>
    </section>
  );
}
