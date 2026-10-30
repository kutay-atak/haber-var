import { Palette } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { InviteCard } from "@/components/groups/invite-card";
import { ScheduleCard } from "@/components/groups/schedule-card";
import { DeleteGroupForm, GroupSettingsForm, MemberManager } from "@/components/groups/settings-forms";
import { TemplateThumb } from "@/components/issues/template-picker";
import { ButtonLink } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth";
import { getActiveInviteToken, getGroupPageData, getSchedule } from "@/lib/data/groups";
import { templateText } from "@/lib/issues";
import { appUrl } from "@/lib/server-env";
import { isUuid } from "@/lib/utils";
import { getLocale, getT } from "@/lib/i18n-server";
import { translator } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Grup ayarları", "Group settings") };
}

export default async function GroupSettingsPage({ params }: PageProps<"/gruplar/[id]/ayarlar">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const user = await requireUser(`/gruplar/${id}/ayarlar`);
  const data = await getGroupPageData(id, user.id);
  if (!data) notFound();
  if (data.myRole !== "admin") redirect(`/gruplar/${id}`);
  const [token, schedule] = await Promise.all([getActiveInviteToken(id), getSchedule(id)]);
  const locale = await getLocale();
  const t = translator(locale);

  return (
    <Container size="md" className="space-y-8">
      <div>
        <Link href={`/gruplar/${id}`} className="text-sm font-bold text-ink-soft hover:text-ink">
          ← {data.group.name}
        </Link>
        <h1 className="mt-1 text-4xl font-semibold">{t("Grup ayarları", "Group settings")}</h1>
      </div>

      <Card className="space-y-5">
        <SectionTitle>{t("Genel", "General")}</SectionTitle>
        <GroupSettingsForm group={data.group} />
      </Card>

      <Card className="space-y-4">
        <SectionTitle>{t("Gazete tasarımı", "Newspaper design")}</SectionTitle>
        <div className="flex flex-wrap items-center gap-5">
          <TemplateThumb id={data.group.default_template} className="w-40 shrink-0" />
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-ink-soft">
              {t("Yeni sayılar", "New issues start with the")}{" "}
              <strong className="text-ink">{templateText(data.group.default_template, locale).name}</strong>{" "}
              {t("şablonu ve grubun varsayılan ayarlarıyla başlar.", "template and the group's default settings.")}
            </p>
            <ButtonLink href={`/gruplar/${id}/tasarim`}>
              <Palette className="size-4" aria-hidden="true" /> {t("Tasarım stüdyosunu aç", "Open the design studio")}
            </ButtonLink>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <SectionTitle>🔁 {t("Otomatik sayılar", "Automatic issues")}</SectionTitle>
        <ScheduleCard groupId={id} schedule={schedule} />
      </Card>

      <InviteCard groupId={id} groupName={data.group.name} token={token} baseUrl={appUrl()} />

      <Card className="space-y-3">
        <SectionTitle>{t("Üyeler", "Members")}</SectionTitle>
        <MemberManager groupId={id} members={data.members} myId={user.id} />
      </Card>

      <Card className="space-y-3 border-[#f3c9c2]">
        <SectionTitle className="text-[#8e2a20]">{t("Tehlikeli bölge", "Danger zone")}</SectionTitle>
        <DeleteGroupForm groupId={id} groupName={data.group.name} />
      </Card>
    </Container>
  );
}
