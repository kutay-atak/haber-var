import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { IssueForm } from "@/components/issues/issue-form";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth";
import { getGroupPageData } from "@/lib/data/groups";
import { getQuestionBank, getUsedQuestionIds } from "@/lib/data/issues";
import { requestTime } from "@/lib/format";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Yeni sayı" };

/** Varsayılan son teslim: bir hafta sonra, Türkiye saatiyle 20:00. */
function defaultDeadline(now: number) {
  const d = new Date(now + 7 * 24 * 60 * 60 * 1000);
  d.setUTCHours(17, 0, 0, 0);
  return d.toISOString();
}

export default async function NewIssuePage({ params }: PageProps<"/gruplar/[id]/yeni-sayi">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const user = await requireUser(`/gruplar/${id}/yeni-sayi`);
  const data = await getGroupPageData(id, user.id);
  if (!data) notFound();
  if (data.myRole !== "admin") redirect(`/gruplar/${id}`);

  const [bank, usedIds] = await Promise.all([getQuestionBank(id), getUsedQuestionIds(id)]);
  const nextNumber = (data.issues[0]?.number ?? 0) + 1;

  return (
    <Container size="md">
      <Link href={`/gruplar/${id}`} className="text-sm font-bold text-ink-soft hover:text-ink">
        ← {data.group.name}
      </Link>
      <h1 className="mb-2 mt-1 text-4xl font-semibold">
        Yeni sayı <span className="text-ink-soft">· Sayı {nextNumber}</span>
      </h1>
      <p className="mb-8 text-lg text-ink-soft">Soruları seç, tarihi belirle, gerisini Haber Var halleder. ✨</p>
      <IssueForm
        groupId={id}
        issueId={null}
        nextNumber={nextNumber}
        initial={{ title: "", deadlineAt: defaultDeadline(requestTime()), template: data.group.default_template, questions: [] }}
        bank={bank}
        usedIds={usedIds}
      />
    </Container>
  );
}
