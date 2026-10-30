import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-4 py-10 sm:py-16">
      {/* Dekoratif kâğıt şekilleri */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 top-24 size-56 rotate-12 rounded-[3rem] bg-mustard-soft" />
        <div className="absolute -right-20 bottom-16 size-72 -rotate-6 rounded-[3.5rem] bg-sage-soft" />
        <div className="absolute right-[12%] top-10 size-24 rotate-45 rounded-3xl bg-terracotta-soft" />
      </div>
      <div className="mb-8 flex w-full max-w-md items-center justify-between">
        <Link href="/" aria-label="Haber Var">
          <Logo />
        </Link>
        <LanguageSwitcher />
      </div>
      <main className="w-full max-w-md">{children}</main>
    </div>
  );
}
