import { CalendarClock, Palette, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import { AnswerForm } from "@/components/answer/answer-form";
import { DraftIssueAdminControls, OpenIssueAdminControls } from "@/components/issues/admin-controls";
import { Newspaper } from "@/components/newspaper/newspaper";
import { NewspaperToolbar } from "@/components/newspaper/toolbar";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { Countdown, LocalDateTime } from "@/components/ui/client-time";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareButtons } from "@/components/ui/share-buttons";
import { requireUser } from "@/lib/auth";
import { getMembers } from "@/lib/data/groups";
import { getIssue, getIssueQuestions, getMyAnswers, getParticipantIds } from "@/lib/data/issues";
import { getNewspaperData } from "@/lib/data/newspaper";
import { parseDesign } from "@/lib/design";
import { requestTime } from "@/lib/format";
import { effectiveStatus, issueLabel, templateFromSlug, TEMPLATES } from "@/lib/issues";
import { runNotifications } from "@/lib/notifications";
import { appUrl } from "@/lib/server-env";
import { isUuid } from "@/lib/utils";

const loadIssue = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const user = await requireUser(`/sayi/${id}`);
  const issue = await getIssue(id, user.id);
  return issue ? { user, issue } : null;
});

export async function generateMetadata({ params }: PageProps<"/sayi/[id]">): Promise<Metadata> {
  const loaded = await loadIssue((await params).id);
  if (!loaded) return { title: "Sayı bulunamadı" };
  return { title: `${loaded.issue.group.name} · ${issueLabel(loaded.issue)}` };
}

export default async function IssuePage({ params, searchParams }: PageProps<"/sayi/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const loaded = await loadIssue(id);
  if (!loaded) notFound();
  const { user, issue } = loaded;
  const isAdmin = issue.myRole === "admin";
  const now = requestTime();
  const status = effectiveStatus(issue, now);
  const backToGroup = { href: `/gruplar/${issue.group_id}`, label: issue.group.name };
  const studioHref = `/sayi/${issue.id}/tasarim`;

  // ── Yayımlandı: gazete ──────────────────────────────────────────────────
  if (status === "published") {
    // Süre yeni dolduysa sayıyı kapat ve "gazete yayında" e-postalarını gönder (sayfayı bekletmeden).
    if (issue.status === "open") after(() => runNotifications({ issueId: issue.id }).catch(console.error));

    const data = await getNewspaperData(issue, issue.group.name);
    const template = templateFromSlug(query.gorunum) ?? issue.template;

    return (
      <main className="px-3 py-8 sm:px-6 sm:py-10 print:p-0">
        <NewspaperToolbar
          basePath={`/sayi/${issue.id}`}
          template={template}
          back={backToGroup}
          studioHref={isAdmin ? studioHref : undefined}
        />
        {data.stats.answers ? (
          <Newspaper data={data} template={template} design={parseDesign(issue.design)} />
        ) : (
          <Container size="sm" as="div">
            <EmptyState emoji="😴" title="Bu sayı sessiz geçti">
              Süre doldu ama kimse yanıt yazmadı. Bir sonraki sayıda herkes daha hevesli olacak!
            </EmptyState>
          </Container>
        )}
      </main>
    );
  }

  // ── Taslak (sadece yöneticiler görebilir) ────────────────────────────────
  if (status === "draft") {
    const questions = await getIssueQuestions(issue.id);
    return (
      <Container size="sm" className="space-y-6">
        <Link href={backToGroup.href} className="text-sm font-bold text-ink-soft hover:text-ink">
          ← {backToGroup.label}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-semibold">{issueLabel(issue)}</h1>
          <Badge tone="mustard">Taslak</Badge>
        </div>
        <Card className="space-y-5">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-ink-soft">
            <CalendarClock className="size-4" aria-hidden="true" /> Son teslim: <LocalDateTime iso={issue.deadline_at} className="text-ink" />
          </p>
          <p className="font-semibold text-ink-soft">
            Şablon: <span className="text-ink">{TEMPLATES[issue.template].emoji} {TEMPLATES[issue.template].name}</span>
          </p>
          <ol className="space-y-2">
            {questions.map((q, i) => (
              <li key={q.id} className="flex gap-3 rounded-2xl bg-white px-4 py-3 font-semibold">
                <span className="font-hand text-2xl leading-none text-terracotta-deep">{i + 1}.</span> {q.question_text}
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={`/sayi/${issue.id}/duzenle`} variant="secondary">
              <PenLine className="size-4" aria-hidden="true" /> Soruları düzenle
            </ButtonLink>
            <ButtonLink href={studioHref} variant="secondary">
              <Palette className="size-4" aria-hidden="true" /> Gazete tasarımı
            </ButtonLink>
          </div>
        </Card>
        <DraftIssueAdminControls issueId={issue.id} />
      </Container>
    );
  }

  // ── Açık: yanıt yazma ───────────────────────────────────────────────────
  const [questions, mine, writerIds, members] = await Promise.all([
    getIssueQuestions(issue.id),
    getMyAnswers(issue.id, user.id),
    getParticipantIds(issue.id),
    getMembers(issue.group_id),
  ]);
  const byQuestion = new Map(mine.map((a) => [a.questionId, a]));
  const writers = members.filter((m) => writerIds.includes(m.user_id));
  const issueUrl = `${appUrl()}/sayi/${issue.id}`;

  return (
    <Container size="md" className="space-y-8">
      <div>
        <Link href={backToGroup.href} className="text-sm font-bold text-ink-soft hover:text-ink">
          ← {backToGroup.label}
        </Link>
        <h1 className="mt-1 text-4xl font-semibold sm:text-5xl">{issueLabel(issue)}</h1>
      </div>

      <Card className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <p className="text-sm font-extrabold uppercase tracking-widest text-ink-soft">Son teslim</p>
          <p className="font-display text-xl font-semibold">
            <LocalDateTime iso={issue.deadline_at} />
          </p>
          <p className="font-bold text-terracotta-deep">
            <Countdown iso={issue.deadline_at} serverNow={now} />
          </p>
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-extrabold uppercase tracking-widest text-ink-soft">Yazanlar</p>
          <p className="font-display text-xl font-semibold">
            {writers.length}/{members.length} kişi
          </p>
          {writers.length ? (
            <AvatarStack size="xs" people={writers.map((w) => ({ name: w.profiles?.display_name ?? "Arkadaş", src: w.profiles?.avatar_url }))} />
          ) : (
            <p className="text-sm text-ink-soft">İlk yazan sen ol! ✨</p>
          )}
        </div>
        <div className="space-y-2 border-t border-line pt-4 sm:col-span-2">
          <p className="text-sm font-bold text-ink-soft">Arkadaşlarını dürt 👉 Bu linki gruba at, herkes doğrudan buraya gelsin:</p>
          <ShareButtons
            url={issueUrl}
            message={`${issue.group.name} grubunun yeni sayısı açık! Yanıtını yazmayı unutma 📰`}
            size="sm"
          />
        </div>
      </Card>

      <p className="rounded-2xl bg-mustard-soft px-5 py-4 font-semibold text-mustard-ink">
        🤫 Yanıtların süre dolana kadar gizli kalır; gazete yayımlanınca herkes birbirininkini görür.
      </p>

      <AnswerForm
        questions={questions.map((q) => ({
          id: q.id,
          text: q.question_text,
          body: byQuestion.get(q.id)?.body ?? "",
          media: byQuestion.get(q.id)?.media ?? [],
        }))}
      />

      {isAdmin ? (
        <Card className="space-y-4">
          <SectionTitle className="text-xl sm:text-xl">Yönetici araçları</SectionTitle>
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-sand/60 p-4">
            <p className="min-w-0 flex-1 text-sm text-ink-soft">
              Gazete yayımlanmadan önce görünümünü hazırla: şablon, renkler, yazı tipleri, editörün notu…
            </p>
            <ButtonLink href={studioHref} size="sm">
              <Palette className="size-4" aria-hidden="true" /> Gazete tasarımı
            </ButtonLink>
          </div>
          <OpenIssueAdminControls issueId={issue.id} deadlineAt={issue.deadline_at} />
        </Card>
      ) : null}
    </Container>
  );
}
