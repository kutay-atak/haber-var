import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "sage";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-terracotta-deep text-white shadow-soft hover:bg-terracotta-ink hover:shadow-lift",
  secondary: "border-2 border-line bg-paper text-ink hover:border-terracotta/60 hover:bg-white",
  ghost: "text-ink-soft hover:bg-sand hover:text-ink",
  danger: "bg-[#fbe4e1] text-[#9b2c22] hover:bg-[#f7d3ce]",
  sage: "bg-sage-deep text-white shadow-soft hover:bg-[#2b5841] hover:shadow-lift",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-4 text-sm",
  md: "min-h-11 px-5 text-[0.95rem]",
  lg: "min-h-13 px-7 text-lg",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap",
    "transition-[transform,background-color,box-shadow,border-color] duration-150 active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, className })} {...props} />;
}
