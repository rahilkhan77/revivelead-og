"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createReactivationCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
  retryFailedCampaignAction,
  sendCampaignAction,
  updateCampaignMessageAction,
} from "@/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type CampaignView = {
  id: string;
  name: string;
  status: string;
  recipients: { id: string; message: string; status: string; leadName: string }[];
};

export function ReactivationStudio({ campaign }: { campaign?: CampaignView }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [days, setDays] = useState("30");

  if (!campaign) {
    return (
      <form
        className="flex flex-wrap items-end gap-2 rounded-2xl border border-border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await createReactivationCampaignAction(form);
            if (!result.ok) toast.error(result.error);
            else {
              toast.success("Campaign drafted with AI messages");
              router.refresh();
            }
          });
        }}
      >
        <div>
          <p className="mb-1 text-xs text-muted-foreground">Segment</p>
          <select name="segment" className="border-input bg-background h-8 rounded-lg border px-2 text-sm">
            <option value="dormant_30">Dormant 30+ days</option>
            <option value="dormant_60">Dormant 60+ days</option>
            <option value="dormant_90">Dormant 90+ days</option>
            <option value="high_value">High-value dormant</option>
            <option value="hot_dormant">Hot dormant</option>
            <option value="no_response">No-response leads</option>
          </select>
        </div>
        <div>
          <p className="mb-1 text-xs text-muted-foreground">No interaction for</p>
          <Input name="days" value={days} onChange={(event) => setDays(event.target.value)} className="w-24" />
        </div>
        <Input name="name" placeholder="Campaign name" className="max-w-xs" />
        <Button type="submit" disabled={pending}>
          Generate AI campaign
        </Button>
      </form>
    );
  }

  const failedCount = campaign.recipients.filter((item) => item.status === "FAILED").length;

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{campaign.name}</p>
          <p className="text-xs text-muted-foreground">{campaign.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {campaign.status === "PAUSED" ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const form = new FormData();
                  form.set("campaignId", campaign.id);
                  const result = await resumeCampaignAction(form);
                  if (!result.ok) toast.error(result.error);
                  else {
                    toast.success("Campaign resumed. Confirm send to continue.");
                    router.refresh();
                  }
                })
              }
            >
              Resume
            </Button>
          ) : campaign.status !== "SENT" ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const form = new FormData();
                  form.set("campaignId", campaign.id);
                  const result = await pauseCampaignAction(form);
                  if (!result.ok) toast.error(result.error);
                  else {
                    toast.success("Campaign paused");
                    router.refresh();
                  }
                })
              }
            >
              Pause
            </Button>
          ) : null}
          {failedCount > 0 ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const form = new FormData();
                  form.set("campaignId", campaign.id);
                  form.set("confirm", "yes");
                  const result = await retryFailedCampaignAction(form);
                  if (!result.ok) toast.error(result.error);
                  else {
                    toast.success("Failed messages queued for retry");
                    router.refresh();
                  }
                })
              }
            >
              Retry failed
            </Button>
          ) : null}
          {campaign.status !== "SENT" && campaign.status !== "PAUSED" ? (
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  if (!window.confirm("Send this campaign on WhatsApp now? This cannot be undone.")) return;
                  const form = new FormData();
                  form.set("campaignId", campaign.id);
                  form.set("confirm", "yes");
                  const result = await sendCampaignAction(form);
                  if (!result.ok) toast.error(result.error);
                  else {
                    toast.success("Campaign sent");
                    router.refresh();
                  }
                })
              }
            >
              Approve & send
            </Button>
          ) : null}
        </div>
      </div>
      <div className="space-y-3">
        {campaign.recipients.map((recipient) => (
          <form
            key={recipient.id}
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await updateCampaignMessageAction(new FormData(event.currentTarget));
                if (!result.ok) toast.error(result.error);
                else toast.success("Message updated");
              });
            }}
          >
            <input type="hidden" name="id" value={recipient.id} />
            <p className="text-xs text-muted-foreground">
              {recipient.leadName} · {recipient.status}
            </p>
            <Textarea name="message" defaultValue={recipient.message} rows={3} />
            {campaign.status !== "SENT" ? (
              <Button type="submit" size="sm" variant="outline">
                Save preview
              </Button>
            ) : null}
          </form>
        ))}
      </div>
    </div>
  );
}
