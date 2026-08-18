import { db } from "@/lib/db";
import { leadLifecycle } from "@/lib/leads/lifecycle";

export async function getIntelligenceMetrics(organizationId: string) {
  const [leads, recovered, chat, chatLeads, handoffs] = await Promise.all([
    db.lead.findMany({
      where: { organizationId },
      select: {
        status: true,
        temperature: true,
        leadScore: true,
        estimatedValue: true,
        revenueAtRisk: true,
        isReactivated: true,
      },
    }),
    db.revenueEvent.aggregate({
      where: { organizationId, type: "reactivated_won" },
      _sum: { amount: true },
    }),
    db.chatSession.aggregate({
      where: { organizationId },
      _count: true,
    }),
    db.chatSession.count({
      where: { organizationId, leadId: { not: null } },
    }),
    db.chatSession.count({
      where: { organizationId, status: "HANDOFF" },
    }),
  ]);

  const dormant = leads.filter((lead) => lead.status === "DORMANT");
  const reactivated = leads.filter((lead) => lead.isReactivated);
  const recoverablePool = dormant.length + reactivated.length;
  const revenueAtRisk = leads.reduce((sum, lead) => sum + (lead.revenueAtRisk ?? 0), 0);
  const estimatedRecoverable = Math.round(revenueAtRisk * 0.45);

  return {
    totalLeads: leads.length,
    activeLeads: leads.filter((lead) => !["WON", "LOST", "DORMANT"].includes(lead.status)).length,
    dormantLeads: dormant.length,
    hotLeads: leads.filter((lead) => lead.temperature === "HOT" && !["WON", "LOST"].includes(lead.status)).length,
    warmLeads: leads.filter((lead) => lead.temperature === "WARM" && !["WON", "LOST"].includes(lead.status)).length,
    coldLeads: leads.filter((lead) => lead.temperature === "COLD" && !["WON", "LOST"].includes(lead.status)).length,
    reactivationCandidates: leads.filter((lead) => leadLifecycle(lead) === "REACTIVATION_CANDIDATE").length,
    highValueLeads: leads.filter((lead) => (lead.estimatedValue ?? 0) >= 2_000_000).length,
    revenueAtRisk,
    estimatedRecoverable,
    recoveredRevenue: recovered._sum.amount ?? 0,
    leadRecoveryRate: recoverablePool ? Math.round((reactivated.length / recoverablePool) * 100) : 0,
    chatSessions: chat._count,
    chatLeads,
    chatHandoffs: handoffs,
    chatConversion: chat._count ? Math.round((chatLeads / chat._count) * 100) : 0,
  };
}
