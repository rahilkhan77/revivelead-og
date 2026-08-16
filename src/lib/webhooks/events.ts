export const WEBHOOK_EVENTS = [
  "lead.created",
  "lead.updated",
  "lead.qualified",
  "lead.hot",
  "lead.dormant",
  "lead.reactivated",
  "lead.replied",
  "followup.created",
  "followup.completed",
  "followup.failed",
  "deal.won",
  "revenue.recovered",
] as const;

export type WebhookEventName = (typeof WEBHOOK_EVENTS)[number];
