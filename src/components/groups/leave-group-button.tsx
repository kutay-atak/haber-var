"use client";

import { LogOut } from "lucide-react";
import { useState, useTransition } from "react";
import { leaveGroup } from "@/actions/groups";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n";

export function LeaveGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useT();

  function leave() {
    if (!window.confirm(t(`"${groupName}" grubundan ayrılmak istediğine emin misin?`, `Are you sure you want to leave "${groupName}"?`))) return;
    startTransition(async () => {
      const result = await leaveGroup(groupId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="ghost" size="sm" onClick={leave} disabled={pending} className="-ml-3 text-[#8e2a20]">
        <LogOut className="size-4" aria-hidden="true" /> {t("Gruptan ayrıl", "Leave group")}
      </Button>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
