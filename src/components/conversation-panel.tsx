"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  qualifyLeadAction,
  sendLeadMessageAction,
  simulateInboundAction,
  suggestReplyAction,
} from "@/actions/leads";
import { createManualFollowUpAction } from "@/actions/follow-ups";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Message = {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string;
  createdAt: Date | string;
  isAiSuggested: boolean;
};

export function ConversationPanel({
  leadId,
  messages,
}: {
  leadId: string;
  messages: Message[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [inbound, setInbound] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-border">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. Send the first reply or simulate an inbound WhatsApp.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                message.direction === "OUTBOUND"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              <p>{message.body}</p>
              {message.isAiSuggested ? (
                <p className="mt-1 text-[10px] opacity-70">AI assisted</p>
              ) : null}
            </div>
          ))
        )}
      </div>
      <div className="space-y-2 border-t border-border p-3">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write a WhatsApp reply..."
          rows={3}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={pending || !body.trim()}
            onClick={() =>
              startTransition(async () => {
                const form = new FormData();
                form.set("leadId", leadId);
                form.set("body", body);
                const result = await sendLeadMessageAction(form);
                if (!result.ok) toast.error(result.error);
                else {
                  setBody("");
                  const sent = result.data as { demo?: boolean } | undefined;
                  toast.success(sent?.demo ? "Sent in demo mode" : "Sent");
                  router.refresh();
                }
              })
            }
          >
            Send
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await suggestReplyAction(leadId);
                if (result.ok && result.data) setBody(result.data.message);
                else toast.error(result.error);
              })
            }
          >
            Suggest reply
          </Button>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await qualifyLeadAction(leadId);
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success("Lead re-qualified");
                  router.refresh();
                }
              })
            }
          >
            Re-qualify with AI
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            value={inbound}
            onChange={(event) => setInbound(event.target.value)}
            placeholder="Simulate inbound WhatsApp"
          />
          <Button
            variant="secondary"
            disabled={pending || !inbound.trim()}
            onClick={() =>
              startTransition(async () => {
                const form = new FormData();
                form.set("leadId", leadId);
                form.set("body", inbound);
                const result = await simulateInboundAction(form);
                if (!result.ok) toast.error(result.error);
                else {
                  setInbound("");
                  router.refresh();
                }
              })
            }
          >
            Receive
          </Button>
        </div>
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            form.set("leadId", leadId);
            startTransition(async () => {
              const result = await createManualFollowUpAction(form);
              if (!result.ok) toast.error(result.error);
              else {
                toast.success("Follow-up scheduled");
                router.refresh();
              }
            });
          }}
        >
          <Input type="datetime-local" name="dueAt" className="max-w-56" required />
          <Input name="message" placeholder="Follow-up note" />
          <Button type="submit" variant="outline">
            Schedule follow-up
          </Button>
        </form>
      </div>
    </div>
  );
}
