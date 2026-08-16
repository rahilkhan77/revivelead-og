import { db } from "@/lib/db";

export async function claimWebhookEvent(provider: string, eventId: string) {
  if (!eventId) return true;
  try {
    await db.webhookEvent.create({ data: { provider, eventId } });
    return true;
  } catch {
    return false;
  }
}
