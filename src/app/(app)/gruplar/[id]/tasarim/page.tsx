import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DesignStudio } from "@/components/design/design-studio";
import { requireUser } from "@/lib/auth";
import { getGroupPageData } from "@/lib/data/groups";
import { DEMO_NEWSPAPER } from "@/lib/demo-newspaper";
import { parseDesign } from "@/lib/design";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Varsayılan gazete tasarımı" };

export default async function GroupDesignPage({ params }: PageProps<"/gruplar/[id]/tasarim">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const user = await requireUser(`/gruplar/${id}/tasarim`);
  const data = await getGroupPageData(id, user.id);
  if (!data) notFound();
  if (data.myRole !== "admin") redirect(`/gruplar/${id}`);

  return (
    <DesignStudio
      mode="group"
      targetId={id}
      initialTemplate={data.group.default_template}
      initialDesign={parseDesign(data.group.default_design)}
      data={{ ...DEMO_NEWSPAPER, groupName: data.group.name, issueNumber: (data.issues[0]?.number ?? 0) + 1 }}
      sampleNotice="Örnek içerikle önizleniyor."
      back={{ href: `/gruplar/${id}/ayarlar`, label: "Grup ayarları" }}
    />
  );
}
