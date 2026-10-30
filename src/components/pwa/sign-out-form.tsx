"use client";

import type { ReactNode } from "react";
import { signOut } from "@/actions/auth";
import { forgetThisDevice } from "./pwa";

/** Çıkış formu: önce bu cihazın bildirim kaydını siler, sonra çıkış yapar. */
export function SignOutForm({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <form
      className={className}
      action={async () => {
        await forgetThisDevice();
        await signOut();
      }}
    >
      {children}
    </form>
  );
}
