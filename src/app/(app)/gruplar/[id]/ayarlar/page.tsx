import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InviteCard } from "@/components/groups/invite-card";
import { DeleteGroupForm, GroupSettingsForm, MemberManager } from "@/components/groups/settings-forms";
import { Card, SectionTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth";
import { getActiveInviteToken, getGroupPageData } from "@/lib/data/groups";
import { appUrl } from "@/lib/server-env";
import { isUuid } from "@/lib/utils";

export const metadata: Metadata = { title: "Grup ayarları" };

export default async function GroupSettingsPage({ params }: PageProps<"/gruplar/[id]/ayarlar">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const user = await requireUser(`/gruplar/${id}/ayarlar`);
  const data = await getGroupPageData(id, user.id);
  if (!data) notFound();
  if (data.myRole !== "admin") redirect(`/gruplar/${id}`);
  const token = await getActiveInviteToken(id);

  return (
    <Container size="md" className="space-y-8">
      <div>
        <Link href={`/gruplar/${id}`} className="text-sm font-bold text-ink-soft hover:text-ink">
          ← {data.group.name}
        </Link>
        <h1 className="mt-1 text-4xl font-semibold">Grup ayarları</h1>
      </div>

      <Card className="space-y-5">
        <SectionTitle>Genel</SectionTitle>
        <GroupSettingsForm group={data.group} />
      </Card>

      <InviteCard groupId={id} groupName={data.group.name} token={token} baseUrl={appUrl()} />

      <Card className="space-y-3">
        <SectionTitle>Üyeler</SectionTitle>
        <MemberManager groupId={id} members={data.members} myId={user.id} />
      </Card>

      <Card className="space-y-3 border-[#f3c9c2]">
        <SectionTitle className="text-[#8e2a20]">Tehlikeli bölge</SectionTitle>
        <DeleteGroupForm groupId={id} groupName={data.group.name} />
      </Card>
    </Container>
  );
}
