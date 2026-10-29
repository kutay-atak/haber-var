import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, OrDivider } from "@/components/auth/auth-card";
import { SignupForm } from "@/components/auth/auth-forms";
import { GoogleButton } from "@/components/auth/google-button";
import { getSessionUser } from "@/lib/auth";
import { safeNext } from "@/lib/utils";

export const metadata: Metadata = { title: "Kayıt ol" };

export default async function SignupPage({ searchParams }: PageProps<"/kayit">) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSessionUser()) redirect(next ?? "/gruplar");

  const loginHref = next ? `/giris?next=${encodeURIComponent(next)}` : "/giris";

  return (
    <AuthCard
      title="Aramıza katıl ✉️"
      subtitle="Bir dakikada hesabını aç, ilk gazeteniz yolda."
      footer={
        <>
          Zaten hesabın var mı?{" "}
          <Link href={loginHref} className="font-bold text-terracotta-deep hover:underline">
            Giriş yap
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
