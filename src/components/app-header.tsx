import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import type { Profile } from "@/lib/types";
import { getT } from "@/lib/i18n-server";
import { LanguageSwitcher } from "@/components/language-switcher";

export async function AppHeader({ profile }: { profile: Profile | null }) {
  const t = await getT();
  const name = profile?.display_name ?? t("Ben", "Me");
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/gruplar" aria-label={t("Gruplarım", "My groups")}>
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/gruplar"
            className="hidden rounded-full px-4 py-2 text-sm font-bold text-ink-soft transition hover:bg-sand hover:text-ink sm:inline-block"
          >
            {t("Gruplarım", "My groups")}
          </Link>
          <LanguageSwitcher />
          <details className="group relative">
            <summary
              className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-sand [&::-webkit-details-marker]:hidden"
              aria-label={t("Hesap menüsü", "Account menu")}
            >
              <Avatar name={name} src={profile?.avatar_url} size="sm" />
              <span className="max-w-32 truncate text-sm font-bold">{name}</span>
            </summary>
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-line bg-paper p-1.5 shadow-lift">
              <Link
                href="/profil"
                className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-sand"
              >
                <UserRound className="size-4" aria-hidden="true" />
                {t("Profilim", "My profile")}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#8e2a20] hover:bg-[#fbe4e1]"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                  {t("Çıkış yap", "Log out")}
                </button>
              </form>
            </div>
          </details>
        </nav>
      </div>
    </header>
  );
}

export async function AppFooter() {
  const t = await getT();
  return (
    <footer className="no-print mt-16 border-t border-line/70 px-4 py-8 text-center text-sm text-ink-soft">
      <span className="font-hand text-xl text-ink">Haber Var</span> · {t("uzaktaki dostlar için, sevgiyle", "with love, for friends far away")} 💌
    </footer>
  );
}
