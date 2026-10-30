import { cn, initials, toneFor } from "@/lib/utils";

const SIZES = {
  xs: "size-7 text-[0.7rem]",
  sm: "size-9 text-xs",
  md: "size-11 text-sm",
  lg: "size-16 text-lg",
} as const;

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const base = cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold", SIZES[size], className);
  if (src) {
    return (
      <img
        src={src}
        alt=""
        title={name}
        className={cn(base, "object-cover")}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    );
  }
  return (
    <span className={cn(base, toneFor(name))} title={name} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 5,
  size = "sm",
  className,
  ringClassName = "ring-paper",
}: {
  people: Array<{ name: string; src?: string | null }>;
  max?: number;
  size?: keyof typeof SIZES;
  className?: string;
  /** Avatarların arasındaki halka; zeminle aynı renkte olmalı. */
  ringClassName?: string;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className={cn("flex items-center -space-x-2", className)} role="group" aria-label={people.map((p) => p.name).join(", ")}>
      {shown.map((p, i) => (
        <Avatar key={`${p.name}-${i}`} name={p.name} src={p.src} size={size} className={cn("ring-[3px]", ringClassName)} />
      ))}
      {rest > 0 ? (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-sand font-bold text-ink-soft ring-[3px]",
            ringClassName,
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      ) : null}
    </div>
  );
}
