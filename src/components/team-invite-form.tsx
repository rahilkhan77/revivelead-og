"use client";

import { useState } from "react";
import { inviteMemberAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function TeamInviteForm() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap gap-2 rounded-2xl border border-border p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await inviteMemberAction(new FormData(event.currentTarget));
        if (!result.ok) toast.error(result.error);
        else {
          setInviteUrl(result.data?.inviteUrl ?? null);
          toast.success("Invitation created");
        }
      }}
    >
      <Input name="email" type="email" placeholder="agent@agency.ae" required className="max-w-xs" />
      <select name="role" className="border-input bg-background h-8 rounded-lg border px-2 text-sm">
        <option value="SALES_AGENT">Sales Agent</option>
        <option value="SALES_MANAGER">Sales Manager</option>
        <option value="ADMIN">Admin</option>
      </select>
      <Button type="submit">Invite</Button>
      {inviteUrl ? <p className="w-full text-xs break-all text-muted-foreground">{inviteUrl}</p> : null}
    </form>
  );
}
