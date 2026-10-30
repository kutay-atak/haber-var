import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { GroupCard } from "@/components/groups/group-card";
import { AppPrompt } from "@/components/pwa/app-prompt";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getMyProfile, requireUser } from "@/lib/auth";
import { listMyGroups } from "@/lib/data/groups";
import { requestTime } from "@/lib/format";
import { getT } from "@/lib/i18n-server";
import { vapidPublicKey } from "@/lib/push";
import { createAdminClient } from "@/lib/supabase/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Gruplarım", "My groups") };
}

export default async function GroupsPage() {
  const user = await requireUser("/gruplar");
  const [groups, profile, vapidKey] = await Promise.all([
    listMyGroups(user.id),
    getMyProfile(),
    vapidPublicKey(createAdminClient()),
  ]);
  const now = requestTime();
  const t = await getT();
  const firstName = profile?.display_name.split(" ")[0];

  return (
    <Container size="lg">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-hand text-2xl text-terracotta-deep">
            {t("Merhaba", "Hi")}
            {firstName ? ` ${firstName}` : ""}
          </p>
          <h1 className="text-4xl font-semibold">{t("Gruplarım", "My groups")}</h1>
        </div>
        {groups.length ? (
          <ButtonLink href="/gruplar/yeni">
            <Plus className="size-5" aria-hidden="true" /> {t("Yeni grup", "New group")}
          </ButtonLink>
        ) : null}
      </div>

      {groups.length ? <AppPrompt vapidKey={vapidKey} /> : null}

      {groups.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} now={now} />
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🏡"
          title={t("Henüz bir grubun yok", "You don't have a group yet")}
          action={
            <ButtonLink href="/gruplar/yeni" size="lg">
              <Plus className="size-5" aria-hidden="true" /> {t("İlk grubunu kur", "Create your first group")}
            </ButtonLink>
          }
        >
          {t(
            "Bir grup kur ve davet linkini arkadaşlarınla paylaş. Bir arkadaşın seni davet ettiyse, gönderdiği linke tıklaman yeterli.",
            "Create a group and share the invite link with your friends. If a friend invited you, just open the link they sent.",
          )}
        </EmptyState>
      )}
    </Container>
  );
}
