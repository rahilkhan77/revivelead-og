import type { Lead } from "@prisma/client";
import { leadLifecycle } from "@/lib/leads/lifecycle";

export type RevenueRisk = {
  riskScore: number;
  estimatedDealValue: number;
  revenueAtRisk: number;
  recommendedAction: string;
  estimate: true;
};

export function calculateRevenueRisk(
  lead: Pick<
    Lead,
    | "estimatedValue"
    | "budgetMax"
    | "budgetMin"
    | "leadScore"
    | "temperature"
    | "status"
    | "lastContactedAt"
    | "timeline"
    | "intent"
    | "intentStrength"
    | "isReactivated"
  >,
): RevenueRisk {
  const estimatedDealValue = lead.estimatedValue ?? lead.budgetMax ?? lead.budgetMin ?? 0;
  let risk = 20;
  if (lead.status === "DORMANT") risk += 35;
  if (lead.status === "LOST") risk += 15;
  if (lead.temperature === "HOT") risk += 15;
  if (lead.temperature === "WARM") risk += 8;
  if ((lead.leadScore ?? 0) >= 75) risk += 10;
  if (lead.intent === "BUYING") risk += 8;
  if (lead.intentStrength === "HIGH") risk += 10;
  if (/(asap|this week|this month)/i.test(lead.timeline ?? "")) risk += 8;
  if (lead.lastContactedAt) {
    const days = (Date.now() - lead.lastContactedAt.getTime()) / 86_400_000;
    if (days >= 90) risk += 15;
    else if (days >= 60) risk += 10;
    else if (days >= 30) risk += 6;
  } else {
    risk += 8;
  }

  const riskScore = Math.max(0, Math.min(100, Math.round(risk)));
  const revenueAtRisk = Math.round(estimatedDealValue * (riskScore / 100));
  const lifecycle = leadLifecycle({
    status: lead.status,
    isReactivated: lead.isReactivated,
    estimatedValue: estimatedDealValue,
    leadScore: lead.leadScore,
    temperature: lead.temperature,
  });

  const recommendedAction =
    lifecycle === "REACTIVATION_CANDIDATE"
      ? "Approve a reactivation campaign and send two matching listings."
      : lead.temperature === "HOT"
        ? "Call within 15 minutes and lock a viewing."
        : "Send a short WhatsApp with matching inventory and a viewing invite.";

  return {
    riskScore,
    estimatedDealValue,
    revenueAtRisk,
    recommendedAction,
    estimate: true,
  };
}
