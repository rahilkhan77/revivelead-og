import type { Lead } from "@prisma/client";

export type LeadLifecycle =
  | "NEW"
  | "ACTIVE"
  | "DORMANT"
  | "REACTIVATION_CANDIDATE"
  | "QUALIFIED"
  | "WON"
  | "LOST";

export function leadLifecycle(lead: Pick<Lead, "status" | "isReactivated" | "estimatedValue" | "leadScore" | "temperature">): LeadLifecycle {
  if (lead.status === "WON") return "WON";
  if (lead.status === "LOST") return "LOST";
  if (lead.status === "DORMANT") {
    const highValue = (lead.estimatedValue ?? 0) >= 1_000_000 || lead.leadScore >= 70 || lead.temperature === "HOT";
    return highValue ? "REACTIVATION_CANDIDATE" : "DORMANT";
  }
  if (["QUALIFIED", "VIEWING_SCHEDULED", "NEGOTIATION"].includes(lead.status)) return "QUALIFIED";
  if (lead.status === "NEW") return "NEW";
  return "ACTIVE";
}
