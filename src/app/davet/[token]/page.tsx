import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptInvite } from "@/actions/groups";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { SubmitButton } from "@/components/ui/submit-button";
import { getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Davet",
  description: "Arkadaşların seni Haber Var'daki gazetelerine davet ediyor.",
};

interface Preview {
  group_id: string;
  group_name: string;
  group_description: string | null;
  member_count: number;
  inviter_name: string | null;
  already_member: boolean;
}

export default async function InvitePage({ params, searchParams }: PageProps<"/davet/[token]">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [user, { data }] = await Promise.all([
    getSessionUser(),
    supabase.rpc("get_invite_preview", { p_token: token }),
  ]);
  const preview = ((data ?? []) as Preview[])[0] ?? null;

  if (preview?.already_member) redirect(`/gruplar/${preview.group_id}`);

  const next = `/davet/${encodeURIComponent(token)}`;
  const error = typeof query.hata === "string" ? query.hata : null;

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
      <Link href="/" className="mb-8" aria-label="Haber Var ana sayfa">
        <Logo />
      </Link>
      <main className="w-full max-w-md">
        {preview ? (
          <Card className="animate-pop space-y-6 text-center">
            <p className="text-6xl" aria-hidden="true">
              💌
            </p>
            <div className="space-y-2">
              <p className="font-hand text-2xl text-terracotta-deep">
                {preview.inviter_name ? `${preview.inviter_name} seni davet ediyor!` : "Bir davetin var!"}
              </p>
              <h1 className="text-3xl font-semibold">{preview.group_name}</h1>
              {preview.group_description ? <p className="text-ink-soft">{preview.group_description}</p> : null}
              <p className="text-sm font-bold text-ink-soft">{preview.member_count} kişi şimdiden burada</p>
            </div>
            <p className="rounded-2xl bg-sand/70 px-4 py-3 text-sm text-ink-soft">
              Haber Var&apos;da arkadaşlar düzenli aralıklarla aynı soruları yanıtlar; süre dolunca hepsi tek bir gazetede
              buluşur.
            </p>
            {error ? <Alert tone="error">{error}</Alert> : null}
            {user ? (
              <form action={acceptInvite.bind(null, token)}>
                <SubmitButton size="lg" className="w-full" pendingText="Katılıyorsun…">
                  Gruba katıl 🎉
                </SubmitButton>
              </form>
            ) : (
              <div className="space-y-3">
                <ButtonLink href={`/kayit?next=${encodeURIComponent(next)}`} size="lg" className="w-full">
                  Kayıt ol ve katıl
                </ButtonLink>
                <ButtonLink href={`/giris?next=${encodeURIComponent(next)}`} variant="secondary" size="lg" className="w-full">
                  Zaten hesabım var
                </ButtonLink>
              </div>
            )}
          </Card>
        ) : (
          <Card className="space-y-4 text-center">
            <p className="text-6xl" aria-hidden="true">
              🧭
            </p>
            <h1 className="text-3xl font-semibold">Bu davet linki çalışmıyor</h1>
            <p className="text-ink-soft">
              Link yanlış kopyalanmış, yenilenmiş ya da süresi dolmuş olabilir. Grubundaki birinden yeni bir link iste.
            </p>
            <ButtonLink href="/" variant="secondary">
              Ana sayfaya dön
            </ButtonLink>
          </Card>
        )}
      </main>
    </div>
  );
}
