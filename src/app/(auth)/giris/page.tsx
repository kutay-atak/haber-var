import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, OrDivider } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";
import { GoogleButton } from "@/components/auth/google-button";
import { Alert } from "@/components/ui/alert";
import { getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Giriş yap", "Log in") };
}

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSessionUser()) redirect(next ?? "/gruplar");

  const t = await getT();
  const signupHref = next ? `/kayit?next=${encodeURIComponent(next)}` : "/kayit";

  return (
    <AuthCard
      title={t("Tekrar hoş geldin", "Welcome back")}
      subtitle={t("Hesabına giriş yap.", "Log in to your account.")}
      footer={
        <>
          {t("Hesabın yok mu?", "Don't have an account?")}{" "}
          <Link href={signupHref} className="font-bold text-terracotta-deep hover:underline">
            {t("Hemen kayıt ol", "Sign up now")}
          </Link>
        </>
      }
    >
      {params.hata ? (
        <Alert tone="error">
          {t("Giriş linki geçersiz ya da süresi dolmuş. Lütfen tekrar dene.", "The login link is invalid or has expired. Please try again.")}
        </Alert>
      ) : null}
      <GoogleButton next={next} />
      <OrDivider />
      <LoginForm next={next} />
    </AuthCard>
  );
}
