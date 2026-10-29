import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="animate-pop space-y-6 p-6 sm:p-8">
      <div className="space-y-1.5 text-center">
        <h1 className="text-3xl font-semibold">{title}</h1>
        {subtitle ? <p className="text-ink-soft">{subtitle}</p> : null}
      </div>
      {children}
      {footer ? <div className="border-t border-line pt-5 text-center text-sm text-ink-soft">{footer}</div> : null}
    </Card>
  );
}

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-ink-soft" role="separator">
      <span className="h-px flex-1 bg-line" />
      ya da
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
