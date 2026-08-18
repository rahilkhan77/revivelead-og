"use client";

import { useRouter } from "next/navigation";
import { assignLeadAction, changeLeadStatusAction } from "@/actions/leads";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/constants";
import type { Lead, Role } from "@prisma/client";
import { toast } from "sonner";

export function LeadActions({
  lead,
  agents,
  canAssign,
}: {
  lead: Lead;
  agents: { userId: string; role: Role; user: { name: string } }[];
  canAssign: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-2">
      <select
        defaultValue={lead.status}
        className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
        onChange={async (event) => {
          const form = new FormData();
          form.set("leadId", lead.id);
          form.set("status", event.target.value);
          const result = await changeLeadStatusAction(form);
          if (!result.ok) toast.error(result.error);
          else {
            toast.success("Status updated");
            router.refresh();
          }
        }}
      >
        {LEAD_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      {canAssign ? (
        <select
          defaultValue={lead.assignedAgentId ?? ""}
          className="border-input bg-background h-8 rounded-lg border px-2 text-sm"
          onChange={async (event) => {
            const form = new FormData();
            form.set("leadId", lead.id);
            form.set("assignedAgentId", event.target.value);
            const result = await assignLeadAction(form);
            if (!result.ok) toast.error(result.error);
            else {
              toast.success("Lead assigned");
              router.refresh();
            }
          }}
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.userId} value={agent.userId}>
              {agent.user.name}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
