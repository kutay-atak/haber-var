import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Yeni grup" };

export default function NewGroupPage() {
  return (
    <Container size="sm">
      <Link href="/gruplar" className="mb-6 inline-flex items-center gap-1.5 font-bold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" /> Gruplarım
      </Link>
      <Card className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Yeni bir grup kur</h1>
          <p className="mt-1 text-ink-soft">
            Grubu kurunca sana bir davet linki vereceğiz. Linki paylaştığın herkes gruba katılabilir.
          </p>
        </div>
        <CreateGroupForm />
      </Card>
    </Container>
  );
}
