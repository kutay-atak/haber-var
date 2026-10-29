"use client";

import { LogOut } from "lucide-react";
import { useState, useTransition } from "react";
import { leaveGroup } from "@/actions/groups";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function LeaveGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function leave() {
    if (!window.confirm(`"${groupName}" grubundan ayrılmak istediğine emin misin?`)) return;
    startTransition(async () => {
      const result = await leaveGroup(groupId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <Button variant="ghost" size="sm" onClick={leave} disabled={pending} className="-ml-3 text-[#8e2a20]">
        <LogOut className="size-4" aria-hidden="true" /> Gruptan ayrıl
      </Button>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
