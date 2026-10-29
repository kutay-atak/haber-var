import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  error: { box: "bg-[#fbe4e1] text-[#8e2a20]", Icon: CircleAlert },
  success: { box: "bg-sage-soft text-sage-deep", Icon: CircleCheck },
  info: { box: "bg-sky-soft text-sky-ink", Icon: Info },
} as const;

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  const { box, Icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-2xl px-4 py-3 text-sm font-semibold", box, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
