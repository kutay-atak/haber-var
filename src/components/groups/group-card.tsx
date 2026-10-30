import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Countdown } from "@/components/ui/client-time";
import type { GroupListItem } from "@/lib/data/groups";
import { formatDate } from "@/lib/format";
import { effectiveStatus } from "@/lib/issues";
import { translator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export async function GroupCard({ group, now }: { group: GroupListItem; now: number }) {
  const locale = await getLocale();
  const t = translator(locale);
  const open = group.issues.find((i) => effectiveStatus(i, now) === "open");
  const lastPublished = group.issues.find((i) => effectiveStatus(i, now) === "published");
  const people = group.members.map((m) => ({
    name: m.profiles?.display_name ?? t("Arkadaş", "Friend"),
    src: m.profiles?.avatar_url,
  }));

  return (
    <Link
      href={`/gruplar/${group.id}`}
      className="group flex flex-col rounded-[1.75rem] border border-line/80 bg-paper p-6 shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-semibold leading-tight">{group.name}</h2>
        {group.myRole === "admin" ? <Badge tone="sky">{t("Yönetici", "Admin")}</Badge> : null}
      </div>
      {group.description ? <p className="mt-1.5 line-clamp-2 text-ink-soft">{group.description}</p> : null}

      <div className="mt-5 flex flex-1 items-end justify-between gap-3">
        <div className="space-y-2">
          <AvatarStack people={people} />
          <p className="text-sm font-semibold text-ink-soft">{group.members.length} {t("kişi", group.members.length === 1 ? "person" : "people")}</p>
        </div>
        <ArrowRight
          className="size-5 text-ink-soft transition group-hover:translate-x-1 group-hover:text-terracotta-deep"
          aria-hidden="true"
        />
      </div>

      <div className="mt-5 border-t border-line/80 pt-4 text-sm font-bold">
        {open ? (
          <span className="flex flex-wrap items-center gap-2 text-sage-deep">
            <span className="size-2 animate-pulse rounded-full bg-sage" aria-hidden="true" />
            {t("Sayı", "Issue")} {open.number} {t("açık", "open")} · <Countdown iso={open.deadline_at} serverNow={now} />
          </span>
        ) : lastPublished ? (
          <span className="text-ink-soft">
            {t("Son sayı", "Latest issue")}: {formatDate(lastPublished.published_at ?? lastPublished.deadline_at, locale)} 📰
          </span>
        ) : (
          <span className="text-ink-soft">{t("Henüz sayı çıkmadı", "No issues yet")}</span>
        )}
      </div>
    </Link>
  );
}
