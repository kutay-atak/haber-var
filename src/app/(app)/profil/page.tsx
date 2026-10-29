import { LogOut } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { signOut } from "@/actions/auth";
import { ProfileForm } from "@/components/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SubmitButton } from "@/components/ui/submit-button";
import { getMyProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profilim" };

export default async function ProfilePage() {
  const user = await requireUser("/profil");
  const profile = await getMyProfile();
  if (!profile) notFound();

  return (
    <Container size="sm" className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" />
        <div>
          <p className="font-hand text-2xl text-terracotta-deep">Merhaba!</p>
          <h1 className="text-4xl font-semibold">{profile.display_name}</h1>
        </div>
      </div>
      <Card>
        <ProfileForm profile={profile} email={user.email} />
      </Card>
      <form action={signOut}>
        <SubmitButton variant="ghost" className="-ml-3 text-[#8e2a20]">
          <LogOut className="size-4" aria-hidden="true" /> Çıkış yap
        </SubmitButton>
      </form>
    </Container>
  );
}
