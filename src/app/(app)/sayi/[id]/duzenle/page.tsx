import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IssueForm } from "@/components/issues/issue-form";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth";
import { getIssue, getIssueQuestions, getQuestionBank, getUsedQuestionIds } from "@/lib/data/issues";
import { isUuid } from "@/lib/utils";
import { getLocale, getT } from "@/lib/i18n-server";
import { translator } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Taslağı düzenle", "Edit draft") };
}

export default async function EditIssuePage({ params }: PageProps<"/sayi/[id]/duzenle">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const user = await requireUser(`/sayi/${id}/duzenle`);
  const issue = await getIssue(id, user.id);
  if (!issue) notFound();
  if (issue.myRole !== "admin" || issue.status !== "draft") redirect(`/sayi/${id}`);

  const locale = await getLocale();
  const t = translator(locale);
  const [questions, bank, usedIds] = await Promise.all([
    getIssueQuestions(id),
    getQuestionBank(issue.group_id, locale),
    getUsedQuestionIds(issue.group_id),
  ]);

  return (
    <Container size="md">
      <Link href={`/sayi/${id}`} className="text-sm font-bold text-ink-soft hover:text-ink">
        ← {t("Taslağa dön", "Back to draft")}
      </Link>
      <h1 className="mb-8 mt-1 text-4xl font-semibold">
        {t("Taslağı düzenle", "Edit draft")} <span className="text-ink-soft">· {t("Sayı", "Issue")} {issue.number}</span>
      </h1>
      <IssueForm
        groupId={issue.group_id}
        issueId={issue.id}
        nextNumber={issue.number}
        initial={{
          title: issue.title ?? "",
          deadlineAt: issue.deadline_at,
          template: issue.template,
          questions: questions.map((q) => ({ text: q.question_text, sourceId: q.source_question_id })),
        }}
        bank={bank}
        usedIds={usedIds.filter((qid) => !questions.some((q) => q.source_question_id === qid))}
      />
    </Container>
  );
}
