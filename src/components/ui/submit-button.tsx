"use client";

import { LoaderCircle } from "lucide-react";
import type { ComponentProps, MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

type Props = ComponentProps<typeof Button> & {
  pendingText?: string;
  /** Gönderimden önce onay sorusu (ör. silme işlemleri için). */
  confirmMessage?: string;
};

/** Form gönderilirken kendini kilitleyen ve dönen bir simge gösteren buton. */
export function SubmitButton({ children, pendingText, confirmMessage, disabled, onClick, ...props }: Props) {
  const { pending } = useFormStatus();

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} onClick={handleClick} {...props}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}
