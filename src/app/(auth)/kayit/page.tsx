import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, OrDivider } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/auth-forms";
import { GoogleButton } from "@/components/auth/google-button";
import { getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Kayıt ol", "Sign up") };
}

export default async function SignupPage({ searchParams }: PageProps<"/kayit">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSessionUser()) redirect(next ?? "/gruplar");

  const t = await getT();
  const loginHref = next ? `/giris?next=${encodeURIComponent(next)}` : "/giris";

  return (
    <AuthCard
      title={t("Hesap oluştur", "Create an account")}
      subtitle={t("Grubunun gazetesine katılmak için hesabını aç.", "Create your account to join your group's newspaper.")}
      footer={
        <>
          {t("Zaten hesabın var mı?", "Already have an account?")}{" "}
          <Link href={loginHref} className="font-bold text-terracotta-deep hover:underline">
            {t("Giriş yap", "Log in")}
          </Link>
        </>
      }
    >
      <GoogleButton next={next} />
      <OrDivider />
      <SignupForm next={next} />
    </AuthCard>
  );
}
