"use client";

import type { FollowUp } from "@prisma/client";
import { sendFollowUpNowAction } from "@/actions/follow-ups";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function FollowUpTimeline({ followUps }: { followUps: FollowUp[] }) {
  const router = useRouter();

  if (followUps.length === 0) {
    return <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>;
  }

  return (
    <ol className="space-y-3">
      {followUps.map((item) => (
        <li key={item.id} className="rounded-xl border border-border px-3 py-2 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{item.type.replaceAll("_", " ")}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(item.dueAt)}</p>
            </div>
            <span className="text-xs text-muted-foreground">{item.status}</span>
          </div>
          {item.message ? <p className="mt-2 text-muted-foreground">{item.message}</p> : null}
          {item.status === "FAILED" ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={async () => {
                const form = new FormData();
                form.set("id", item.id);
                const result = await sendFollowUpNowAction(form);
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success("Retry queued");
                  router.refresh();
                }
              }}
            >
              Retry
            </Button>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
