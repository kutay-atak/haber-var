import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Yeni grup", "New group") };
}

export default async function NewGroupPage() {
  const t = await getT();
  return (
    <Container size="sm">
      <Link href="/gruplar" className="mb-6 inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> {t("Gruplarım", "My groups")}
      </Link>
      <Card className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">{t("Yeni bir grup kur", "Create a new group")}</h1>
          <p className="mt-1 text-ink-soft">
            {t(
              "Grubu kurunca sana bir davet linki vereceğiz. Linki paylaştığın herkes gruba katılabilir.",
              "Once the group is created we'll give you an invite link. Anyone you share it with can join.",
            )}
          </p>
        </div>
        <CreateGroupForm />
      </Card>
    </Container>
  );
}
