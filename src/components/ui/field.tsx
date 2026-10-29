import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputClasses = cn(
  "w-full rounded-2xl border-2 border-line bg-white px-4 py-3 text-base text-ink",
  "placeholder:text-ink-soft/70 transition-[border-color,box-shadow]",
  "focus:border-terracotta focus:outline-none focus:ring-4 focus:ring-terracotta/15",
  "disabled:cursor-not-allowed disabled:bg-sand/60",
);

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClasses, "min-h-28 resize-y leading-relaxed", className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-sm text-ink-soft">{hint}</p> : null}
    </div>
  );
}
