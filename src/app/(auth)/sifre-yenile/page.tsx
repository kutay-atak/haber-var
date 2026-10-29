import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Yeni şifre" };

export default async function ResetPasswordPage() {
  await requireUser("/sifre-yenile");
  return (
    <AuthCard title="Yeni şifreni belirle" subtitle="Bu sefer akılda kalıcı bir şey seç 😉">
      <ResetPasswordForm />
    </AuthCard>
  );
}
