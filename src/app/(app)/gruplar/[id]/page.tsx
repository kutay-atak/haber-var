import { Coffee, FilePenLine, Plus, Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InviteCard } from "@/components/groups/invite-card";
import { LeaveGroupButton } from "@/components/groups/leave-group-button";
import { CurrentIssueCard } from "@/components/issues/current-issue-card";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth";
import { getActiveInviteToken, getGroupPageData } from "@/lib/data/groups";
import { getParticipantIds } from "@/lib/data/issues";
import { formatDate, requestTime } from "@/lib/format";
import { effectiveStatus, TEMPLATES } from "@/lib/issues";
import { appUrl } from "@/lib/server-env";
import { isUuid } from "@/lib/utils";
import { translator } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n-server";

export async function generateMetadata({ params }: PageProps<"/gruplar/[id]">): Promise<Metadata> {
  const { id } = await params;
  const t = await getT();
  if (!isUuid(id)) return { title: t("Grup", "Group") };
  const user = await requireUser(`/gruplar/${id}`);
  const data = await getGroupPageData(id, user.id);
  return { title: data?.group.name ?? t("Grup", "Group") };
}

export default async function GroupPage({ params, searchParams }: PageProps<"/gruplar/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!isUuid(id)) notFound();
  const user = await requireUser(`/gruplar/${id}`);
  const data = await getGroupPageData(id, user.id);
  if (!data) notFound();

  const { group, members, issues, myRole } = data;
  const isAdmin = myRole === "admin";
  const now = requestTime();
  const current = issues.find((i) => effectiveStatus(i, now) === "open");
  const drafts = isAdmin ? issues.filter((i) => i.status === "draft") : [];
  const archive = issues.filter((i) => effectiveStatus(i, now) === "published");
  const [writerIds, inviteToken] = await Promise.all([
    current ? getParticipantIds(current.id) : Promise.resolve([]),
    isAdmin ? getActiveInviteToken(group.id) : Promise.resolve(null),
  ]);
  const isNew = query.yeni === "1";
  const locale = await getLocale();
  const t = translator(locale);

  return (
    <Container size="lg">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href="/gruplar" className="text-sm font-bold text-ink-soft hover:text-ink">
            ← {t("Gruplarım", "My groups")}
          </Link>
          <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{group.name}</h1>
          {group.description ? <p className="mt-2 max-w-2xl text-lg text-ink-soft">{group.description}</p> : null}
        </div>
        {isAdmin ? (
          <ButtonLink href={`/gruplar/${group.id}/ayarlar`} variant="secondary">
            <Settings className="size-4" aria-hidden="true" /> {t("Ayarlar", "Settings")}
          </ButtonLink>
        ) : null}
      </div>

      {isNew ? (
        <Alert tone="success" className="mb-6 text-base">
          {t(
            "Grubun hazır! 🎉 Şimdi davet linkini arkadaşlarınla paylaş, sonra ilk sayıyı başlat.",
            "Your group is ready! 🎉 Now share the invite link with your friends, then start the first issue.",
          )}
        </Alert>
      ) : null}
      {query.katildin === "1" ? (
        <Alert tone="success" className="mb-6 text-base">
          {t(
            "Gruba hoş geldin! 🎈 Açık bir sayı varsa hemen yazmaya başlayabilirsin.",
            "Welcome to the group! 🎈 If there's an open issue, you can start writing right away.",
          )}
        </Alert>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="min-w-0 space-y-8">
          {current ? (
            <CurrentIssueCard issue={current} members={members} writerIds={writerIds} myId={user.id} now={now} />
          ) : isAdmin ? (
            <EmptyState
              emoji="🗞️"
              title={
                issues.length
                  ? t("Sıradaki sayıyı başlat", "Start the next issue")
                  : t("İlk sayıyı başlatmaya hazır mısın?", "Ready to start your first issue?")
              }
              action={
                <ButtonLink href={`/gruplar/${group.id}/yeni-sayi`} size="lg">
                  <Plus className="size-5" aria-hidden="true" /> {t("Yeni sayı hazırla", "Prepare a new issue")}
                </ButtonLink>
              }
            >
              {t(
                "Soruları seç, son teslim tarihini belirle. Başlattığında herkese e-posta gider.",
                "Pick the questions and set a deadline. When you start it, everyone gets an email.",
              )}
            </EmptyState>
          ) : (
            <EmptyState emoji="☕" title={t("Yeni sayı hazırlanıyor", "A new issue is on the way")}>
              {t(
                "Şu an açık bir sayı yok. Yönetici yeni sayıyı başlatınca sana e-posta ile haber vereceğiz.",
                "There's no open issue right now. We'll email you when an admin starts the next one.",
              )}
            </EmptyState>
          )}

          {drafts.length ? (
            <section className="space-y-3">
              <SectionTitle>{t("Taslaklar", "Drafts")}</SectionTitle>
              {drafts.map((d) => (
                <Link
                  key={d.id}
                  href={`/sayi/${d.id}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-line bg-paper px-5 py-4 transition hover:border-terracotta/50"
                >
                  <span className="flex items-center gap-3 font-bold">
                    <FilePenLine className="size-5 text-ink-soft" aria-hidden="true" />
                    {t("Sayı", "Issue")} {d.number}
                    {d.title ? ` · ${d.title}` : ""}
                  </span>
                  <Badge tone="mustard">{t("Taslak", "Draft")}</Badge>
                </Link>
              ))}
            </section>
          ) : null}

          <section className="space-y-4">
            <SectionTitle>{t("Arşiv", "Archive")}</SectionTitle>
            {archive.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {archive.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/sayi/${issue.id}`}
                    className="group rounded-[1.5rem] border border-line/80 bg-[#fbf7ee] p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <p className="border-b-2 border-double border-ink/40 pb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-ink-soft">
                      {TEMPLATES[issue.template].emoji} {t("Sayı", "Issue")} {issue.number} ·{" "}
                      {formatDate(issue.published_at ?? issue.deadline_at, locale)}
                    </p>
                    <p className="mt-3 font-display text-2xl font-semibold group-hover:text-terracotta-deep">
                      {issue.title || t(`${group.name} Gazetesi`, `The ${group.name} Gazette`)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink-soft">{t("Gazeteyi oku", "Read the newspaper")} →</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 rounded-2xl bg-paper/70 px-5 py-4 text-ink-soft">
                <Coffee className="size-5" aria-hidden="true" /> {t("Yayımlanan sayılar burada birikecek.", "Published issues will collect here.")}
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {isAdmin ? (
            <InviteCard
              groupId={group.id}
              groupName={group.name}
              token={inviteToken}
              baseUrl={appUrl()}
              highlight={isNew}
            />
          ) : null}
          <Card className="space-y-4 p-5 sm:p-6">
            <SectionTitle className="text-xl sm:text-xl">
              {t("Üyeler", "Members")} ({members.length})
            </SectionTitle>
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center gap-3">
                  <Avatar name={m.profiles?.display_name ?? t("Arkadaş", "Friend")} src={m.profiles?.avatar_url} size="sm" />
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {m.profiles?.display_name ?? t("Arkadaş", "Friend")}
                    {m.user_id === user.id ? <span className="text-ink-soft"> ({t("sen", "you")})</span> : null}
                  </span>
                  {m.role === "admin" ? <Badge tone="sky">{t("Yönetici", "Admin")}</Badge> : null}
                </li>
              ))}
            </ul>
            <div className="border-t border-line pt-3">
              <LeaveGroupButton groupId={group.id} groupName={group.name} />
            </div>
          </Card>
        </aside>
      </div>
    </Container>
  );
}
