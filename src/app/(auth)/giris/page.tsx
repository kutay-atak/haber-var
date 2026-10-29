import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, OrDivider } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-forms";
import { GoogleButton } from "@/components/auth/google-button";
import { Alert } from "@/components/ui/alert";
import { getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Giriş yap" };

export default async function LoginPage({ searchParams }: PageProps<"/giris">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSessionUser()) redirect(next ?? "/gruplar");

  const signupHref = next ? `/kayit?next=${encodeURIComponent(next)}` : "/kayit";

  return (
    <AuthCard
      title="Tekrar hoş geldin! 👋"
      subtitle="Arkadaşların yeni haberlerini bekliyor."
      footer={
        <>
          Hesabın yok mu?{" "}
          <Link href={signupHref} className="font-bold text-terracotta-deep hover:underline">
            Hemen kayıt ol
          </Link>
        </>
      }
    >
      {params.hata ? (
        <Alert tone="error">Giriş linki geçersiz ya da süresi dolmuş. Lütfen tekrar dene.</Alert>
      ) : null}
      <GoogleButton next={next} />
      <OrDivider />
      <LoginForm next={next} />
    </AuthCard>
  );
}
