import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-7xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="mt-4 text-4xl font-semibold">Bu sayfa kaybolmuş</h1>
      <p className="mt-2 max-w-md text-lg text-ink-soft">
        Aradığın sayfa taşınmış, silinmiş ya da hiç var olmamış olabilir. Belki de bu gruba üye değilsindir.
      </p>
      <ButtonLink href="/gruplar" className="mt-8" size="lg">
        Gruplarıma dön
      </ButtonLink>
    </main>
  );
}
