import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { GroupCard } from "@/components/groups/group-card";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getMyProfile, requireUser } from "@/lib/auth";
import { listMyGroups } from "@/lib/data/groups";
import { requestTime } from "@/lib/format";

export const metadata: Metadata = { title: "Gruplarım" };

export default async function GroupsPage() {
  const user = await requireUser("/gruplar");
  const [groups, profile] = await Promise.all([listMyGroups(user.id), getMyProfile()]);
  const now = requestTime();
  const firstName = profile?.display_name.split(" ")[0];

  return (
    <Container size="lg">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-hand text-2xl text-terracotta-deep">Merhaba{firstName ? ` ${firstName}` : ""}! 👋</p>
          <h1 className="text-4xl font-semibold">Gruplarım</h1>
        </div>
        {groups.length ? (
          <ButtonLink href="/gruplar/yeni">
            <Plus className="size-5" aria-hidden="true" /> Yeni grup
          </ButtonLink>
        ) : null}
      </div>

      {groups.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} now={now} />
          ))}
        </div>
      ) : (
        <EmptyState
          emoji="🏡"
          title="Henüz bir grubun yok"
          action={
            <ButtonLink href="/gruplar/yeni" size="lg">
              <Plus className="size-5" aria-hidden="true" /> İlk grubunu kur
            </ButtonLink>
          }
        >
          Bir grup kur ve davet linkini arkadaşlarınla paylaş. Bir arkadaşın seni davet ettiyse, gönderdiği linke
          tıklaman yeterli.
        </EmptyState>
      )}
    </Container>
  );
}
