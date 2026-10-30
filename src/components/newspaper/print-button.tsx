"use client";

import { Printer } from "lucide-react";
import { useT } from "@/components/i18n";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const t = useT();
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      <Printer className="size-4" aria-hidden="true" /> {t("Yazdır / PDF", "Print / PDF")}
    </Button>
  );
}
