import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Container({
  className,
  size = "md",
  as: Tag = "main",
  ...props
}: HTMLAttributes<HTMLElement> & { size?: "sm" | "md" | "lg"; as?: "main" | "div" }) {
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-4 py-8 sm:px-6 sm:py-12",
        size === "sm" && "max-w-2xl",
        size === "md" && "max-w-4xl",
        size === "lg" && "max-w-6xl",
        className,
      )}
      {...props}
    />
  );
}
