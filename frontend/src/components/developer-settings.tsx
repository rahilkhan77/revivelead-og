"use client";

import { useState } from "react";
import { createApiKeyAction, revokeApiKeyAction } from "@/actions/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function DeveloperSettings({
  widgetKey,
  keys,
}: {
  widgetKey: string | null;
  keys: { id: string; name: string; prefix: string; revokedAt: Date | null }[];
}) {
  const [secret, setSecret] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://app.revivelead.com";

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-sm font-medium">Developer / n8n</h2>
      <div className="rounded-lg border border-border p-4 text-sm">
        <p className="font-medium">Website chatbot widget</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">{`<script src="${origin}/widget.js" data-widget-key="${widgetKey ?? "generate-on-save"}"></script>`}</pre>
        <p className="mt-2 text-xs text-muted-foreground">Public widget key only. It never exposes organization IDs or secrets.</p>
      </div>
      <form
        className="flex flex-wrap gap-2 rounded-lg border border-border p-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await createApiKeyAction(new FormData(event.currentTarget));
          if (!result.ok) toast.error(result.error);
          else {
            setSecret(result.data?.secret ?? null);
            toast.success("API key created. Copy it now — it will not be shown again.");
          }
        }}
      >
        <Input name="name" placeholder="n8n production" className="max-w-xs" />
        <Button type="submit">Generate API key</Button>
      </form>
      {secret ? <p className="break-all text-sm">New key (shown once): {secret}</p> : null}
      <div className="space-y-2">
        {keys.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
            <span>
              {item.name} · {item.prefix}… {item.revokedAt ? "(revoked)" : ""}
            </span>
            {!item.revokedAt ? (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const form = new FormData();
                  form.set("id", item.id);
                  const result = await revokeApiKeyAction(form);
                  if (!result.ok) toast.error(result.error);
                  else toast.success("Key revoked");
                }}
              >
                Revoke
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
