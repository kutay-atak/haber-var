import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Şifremi unuttum" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Şifreni mi unuttun? 🔑"
      subtitle="Olur öyle şeyler. E-postanı yaz, yenileme linkini gönderelim."
      footer={
        <Link href="/giris" className="font-bold text-terracotta-deep hover:underline">
          Girişe dön
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
