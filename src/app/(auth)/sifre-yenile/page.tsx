import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Yeni şifre", "New password") };
}

export default async function ResetPasswordPage() {
  await requireUser("/sifre-yenile");
  const t = await getT();
  return (
    <AuthCard
      title={t("Yeni şifreni belirle", "Choose a new password")}
      subtitle={t("En az 8 karakterli yeni bir şifre seç.", "Choose a new password of at least 8 characters.")}
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
