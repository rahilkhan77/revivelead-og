import { db } from "@/lib/db";
import { parseJson } from "@/lib/format";

export async function dispatchWebhooks(
  organizationId: string,
  event: string,
  payload: Record<string, unknown>,
) {
  const hooks = await db.integration.findMany({
    where: {
      organizationId,
      type: { in: ["WEBHOOK", "N8N"] },
      enabled: true,
    },
  });

  await Promise.all(
    hooks.map(async (hook) => {
      const config = parseJson<{ url?: string; secret?: string }>(hook.config, {});
      if (!config.url) return;
      try {
        await fetch(config.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-ReviveLead-Event": event,
            ...(config.secret ? { "X-ReviveLead-Secret": config.secret } : {}),
          },
          body: JSON.stringify({ event, organizationId, payload, sentAt: new Date().toISOString() }),
        });
      } catch (error) {
        console.error("Webhook dispatch failed", hook.id, error);
      }
    }),
  );
}
