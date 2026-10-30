import { getT } from "@/lib/i18n-server";

export default async function Loading() {
  const t = await getT();
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6" role="status" aria-live="polite">
      <p className="mb-6 font-hand text-2xl text-ink-soft">{t("Gazete kâğıtları hazırlanıyor…", "Getting the newsprint ready…")}</p>
      <div className="space-y-4">
        <div className="h-10 w-2/3 animate-pulse rounded-2xl bg-sand" />
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-sand/80" />
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-sand/60" />
      </div>
    </div>
  );
}
