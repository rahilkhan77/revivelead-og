"use client";

import { useRouter } from "next/navigation";
import { deleteAutomationAction, toggleAutomationAction, upsertAutomationAction } from "@/actions/automations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Automation, AutomationExecution } from "@prisma/client";
import { toast } from "sonner";

const triggers = ["LEAD_CREATED", "LEAD_INACTIVE", "FOLLOW_UP_DUE", "LEAD_BECOMES_HOT", "NO_RESPONSE"];
const actions = [
  "SEND_WHATSAPP",
  "SEND_EMAIL",
  "CREATE_TASK",
  "NOTIFY_AGENT",
  "CHANGE_LEAD_STATUS",
  "ASSIGN_AGENT",
];

export function AutomationBuilder({
  automations,
}: {
  automations: (Automation & { executions: AutomationExecution[] })[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-2xl border border-border p-4 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await upsertAutomationAction(new FormData(event.currentTarget));
          if (!result.ok) toast.error(result.error);
          else {
            toast.success("Automation saved");
            router.refresh();
            event.currentTarget.reset();
          }
        }}
      >
        <Input name="name" placeholder="Automation name" required />
        <select name="trigger" className="border-input bg-background h-8 rounded-lg border px-2 text-sm">
          {triggers.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <select name="action" className="border-input bg-background h-8 rounded-lg border px-2 text-sm">
          {actions.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <Input name="message" placeholder="Optional message / note" />
        <input type="hidden" name="enabled" value="true" />
        <Button type="submit" className="md:col-span-2 w-fit">
          Add automation
        </Button>
      </form>

      <div className="space-y-3">
        {automations.map((automation) => (
          <div key={automation.id} className="rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{automation.name}</p>
                <p className="text-sm text-muted-foreground">
                  When {automation.trigger.replaceAll("_", " ").toLowerCase()} →{" "}
                  {automation.action.replaceAll("_", " ").toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={automation.enabled}
                  onCheckedChange={async () => {
                    const form = new FormData();
                    form.set("id", automation.id);
                    await toggleAutomationAction(form);
                    router.refresh();
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const form = new FormData();
                    form.set("id", automation.id);
                    await deleteAutomationAction(form);
                    router.refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
            {automation.executions[0] ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Last run {automation.executions[0].status} · {automation.executions.length} recent executions
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">No executions yet</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
