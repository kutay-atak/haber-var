import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DesignStudio } from "@/components/design/design-studio";
import { requireUser } from "@/lib/auth";
import { getGroupPageData } from "@/lib/data/groups";
import { demoNewspaper } from "@/lib/demo-newspaper";
import { parseDesign } from "@/lib/design";
import { isUuid } from "@/lib/utils";
import { getLocale, getT } from "@/lib/i18n-server";
import { translator } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Varsayılan gazete tasarımı", "Default newspaper design") };
}

export default async function GroupDesignPage({ params }: PageProps<"/gruplar/[id]/tasarim">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const user = await requireUser(`/gruplar/${id}/tasarim`);
  const data = await getGroupPageData(id, user.id);
  if (!data) notFound();
  if (data.myRole !== "admin") redirect(`/gruplar/${id}`);
  const locale = await getLocale();
  const t = translator(locale);

  return (
    <DesignStudio
      mode="group"
      targetId={id}
      initialTemplate={data.group.default_template}
      initialDesign={parseDesign(data.group.default_design)}
      data={{ ...demoNewspaper(locale), groupName: data.group.name, issueNumber: (data.issues[0]?.number ?? 0) + 1 }}
      sampleNotice={t("Örnek içerikle önizleniyor.", "Previewing with sample content.")}
      back={{ href: `/gruplar/${id}/ayarlar`, label: t("Grup ayarları", "Group settings") }}
    />
  );
}
