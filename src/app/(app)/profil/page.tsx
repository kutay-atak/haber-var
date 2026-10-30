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
import { getT } from "@/lib/i18n-server";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Profilim", "My profile") };
}

export default async function ProfilePage() {
  const user = await requireUser("/profil");
  const profile = await getMyProfile();
  if (!profile) notFound();
  const t = await getT();

  return (
    <Container size="sm" className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={profile.display_name} src={profile.avatar_url} size="lg" />
        <div>
          <p className="font-hand text-2xl text-terracotta-deep">{t("Merhaba!", "Hello!")}</p>
          <h1 className="text-4xl font-semibold">{profile.display_name}</h1>
        </div>
      </div>
      <Card>
        <ProfileForm profile={profile} email={user.email} />
      </Card>
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold">{t("Dil", "Language")}</p>
          <p className="text-sm text-ink-soft">{t("Arayüz ve e-postalar bu dilde olur.", "The app and your emails will use this language.")}</p>
        </div>
        <LanguageSwitcher />
      </Card>
      <form action={signOut}>
        <SubmitButton variant="ghost" className="-ml-3 text-[#8e2a20]">
          <LogOut className="size-4" aria-hidden="true" /> {t("Çıkış yap", "Log out")}
        </SubmitButton>
      </form>
    </Container>
  );
}
