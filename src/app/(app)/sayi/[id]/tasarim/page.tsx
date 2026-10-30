import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DesignStudio } from "@/components/design/design-studio";
import { requireUser } from "@/lib/auth";
import { getIssue } from "@/lib/data/issues";
import { getNewspaperData } from "@/lib/data/newspaper";
import { demoNewspaper } from "@/lib/demo-newspaper";
import { parseDesign } from "@/lib/design";
import { requestTime } from "@/lib/format";
import { effectiveStatus, issueLabel } from "@/lib/issues";
import { isUuid } from "@/lib/utils";
import { translator } from "@/lib/i18n";
import { getLocale, getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Tasarım stüdyosu", "Design studio") };
}

export default async function IssueDesignPage({ params }: PageProps<"/sayi/[id]/tasarim">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const user = await requireUser(`/sayi/${id}/tasarim`);
  const issue = await getIssue(id, user.id);
  if (!issue) notFound();
  if (issue.myRole !== "admin") redirect(`/sayi/${id}`);

  const locale = await getLocale();
  const t = translator(locale);
  // Yanıtlar yayımlanana kadar gizli: o zamana kadar örnek içerikle önizlenir.
  const published = effectiveStatus(issue, requestTime()) === "published";
  const data = published
    ? await getNewspaperData(issue, issue.group.name)
    : {
        ...demoNewspaper(locale),
        groupName: issue.group.name,
        issueNumber: issue.number,
        issueTitle: issue.title,
        publishedAt: issue.deadline_at,
      };

  return (
    <DesignStudio
      mode="issue"
      targetId={issue.id}
      initialTemplate={issue.template}
      initialDesign={parseDesign(issue.design)}
      data={data}
      sampleNotice={
        published
          ? null
          : t(
              "Yanıtlar gazete yayımlanana kadar gizli; şimdilik örnek içerikle önizleniyor.",
              "Answers stay hidden until the newspaper is published, so this preview uses sample content.",
            )
      }
      back={{ href: `/sayi/${issue.id}`, label: issueLabel(issue, t) }}
      viewHref={published ? `/sayi/${issue.id}` : undefined}
    />
  );
}
