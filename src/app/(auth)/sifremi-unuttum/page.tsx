import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Şifremi unuttum", "Forgot password") };
}

export default async function ForgotPasswordPage() {
  const t = await getT();
  return (
    <AuthCard
      title={t("Şifreni mi unuttun?", "Forgot your password?")}
      subtitle={t("E-postanı yaz, şifre yenileme linkini gönderelim.", "Enter your email and we'll send you a reset link.")}
      footer={
        <Link href="/giris" className="font-bold text-terracotta-deep hover:underline">
          {t("Girişe dön", "Back to login")}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
