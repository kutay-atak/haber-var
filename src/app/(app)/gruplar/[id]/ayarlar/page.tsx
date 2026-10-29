import { Palette } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InviteCard } from "@/components/groups/invite-card";
import { DeleteGroupForm, GroupSettingsForm, MemberManager } from "@/components/groups/settings-forms";
import { TemplateThumb } from "@/components/issues/template-picker";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth";
import { getActiveInviteToken, getGroupPageData } from "@/lib/data/groups";
import { TEMPLATES } from "@/lib/issues";
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

      <Card className="space-y-4">
        <SectionTitle>Gazete tasarımı</SectionTitle>
        <div className="flex flex-wrap items-center gap-5">
          <TemplateThumb id={data.group.default_template} className="w-40 shrink-0" />
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-ink-soft">
              Yeni sayılar <strong className="text-ink">{TEMPLATES[data.group.default_template].name}</strong> şablonu ve
              grubun varsayılan ayarlarıyla başlar. Stüdyoda 9 şablon, 15 renk paleti, 12 yazı tipi, kâğıt dokuları,
              fotoğraf filtreleri ve daha fazlası var.
            </p>
            <ButtonLink href={`/gruplar/${id}/tasarim`}>
              <Palette className="size-4" aria-hidden="true" /> Tasarım stüdyosunu aç
            </ButtonLink>
          </div>
        </div>
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
