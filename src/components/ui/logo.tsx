import { cn } from "@/lib/utils";

/** Katlanmış küçük bir gazete ve "Haber Var" yazısı. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("size-9", className)} aria-hidden="true">
      <rect x="5" y="9" width="38" height="31" rx="7" fill="#e07a5f" transform="rotate(-6 24 24)" />
      <rect x="7" y="8" width="34" height="30" rx="6" fill="#fffdf9" stroke="#3d405b" strokeWidth="2.5" />
      <rect x="12" y="13" width="24" height="5" rx="2" fill="#3d405b" />
      <rect x="12" y="22" width="11" height="10" rx="2" fill="#f2cc8f" />
      <path d="M26 23h10M26 27h10M26 31h7" stroke="#3d405b" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="font-display text-[1.45rem] font-bold leading-none tracking-tight">
        Haber <span className="text-terracotta-deep">Var</span>
      </span>
    </span>
  );
}
