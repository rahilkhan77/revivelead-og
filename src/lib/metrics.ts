import { subDays } from "date-fns";
import { canViewAllLeads } from "@/lib/roles";
import { db } from "@/lib/db";
import { leadVisibilityWhere } from "@/lib/leads/service";
import type { Role } from "@prisma/client";

export async function getDashboardMetrics(organizationId: string, userId: string, role: Role) {
  const where = leadVisibilityWhere(organizationId, userId, canViewAllLeads(role));
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const followUpWhere = {
    organizationId,
    ...(canViewAllLeads(role) ? {} : { assignedToId: userId }),
  };

  const [
    totalLeads,
    newLeads,
    hotLeads,
    followUpsDue,
    dormantLeads,
    atRisk,
    reactivated,
    qualified,
    won,
    recovered,
    atRiskValue,
    firstTouches,
  ] = await Promise.all([
    db.lead.count({ where }),
    db.lead.count({ where: { ...where, status: "NEW" } }),
    db.lead.count({ where: { ...where, temperature: "HOT", status: { notIn: ["WON", "LOST"] } } }),
    db.followUp.count({
      where: { ...followUpWhere, status: "PENDING", dueAt: { lte: now } },
    }),
    db.lead.count({ where: { ...where, status: "DORMANT" } }),
    db.lead.count({
      where: {
        ...where,
        status: { in: ["NEW", "CONTACTED", "DORMANT"] },
        OR: [{ lastContactedAt: { lte: weekAgo } }, { lastContactedAt: null, createdAt: { lte: weekAgo } }],
      },
    }),
    db.lead.count({ where: { ...where, isReactivated: true } }),
    db.lead.count({
      where: {
        ...where,
        status: { in: ["QUALIFIED", "VIEWING_SCHEDULED", "NEGOTIATION"] },
      },
    }),
    db.lead.count({ where: { ...where, status: "WON" } }),
    db.revenueEvent.aggregate({
      where: { organizationId, type: "reactivated_won" },
      _sum: { amount: true },
      _count: true,
    }),
    db.lead.aggregate({
      where: { ...where, status: { in: ["DORMANT", "LOST"] } },
      _sum: { estimatedValue: true },
    }),
    db.lead.findMany({
      where: { ...where, lastContactedAt: { not: null } },
      select: { createdAt: true, lastContactedAt: true },
      take: 200,
    }),
  ]);

  const conversionRate = totalLeads ? Math.round((won / totalLeads) * 100) : 0;
  const recoverablePool = dormantLeads + reactivated;
  const leadRecoveryRate = recoverablePool ? Math.round((reactivated / recoverablePool) * 100) : 0;
  const responseSamples = firstTouches
    .map((lead) => {
      if (!lead.lastContactedAt) return null;
      return (lead.lastContactedAt.getTime() - lead.createdAt.getTime()) / 36e5;
    })
    .filter((value): value is number => value != null && value >= 0 && value < 24 * 30);
  const responseTimeHours = responseSamples.length
    ? Math.round((responseSamples.reduce((sum, value) => sum + value, 0) / responseSamples.length) * 10) / 10
    : 0;

  const statusRows = await db.lead.groupBy({
    by: ["status"],
    where,
    _count: { _all: true },
  });

  const temperatureRows = await db.lead.groupBy({
    by: ["temperature"],
    where: { ...where, status: { notIn: ["WON", "LOST"] } },
    _count: { _all: true },
  });

  return {
    totalLeads,
    newLeads,
    hotLeads,
    followUpsDue,
    dormantLeads,
    atRisk,
    reactivated,
    qualified,
    won,
    recoveredOpportunities: recovered._count,
    recoveredRevenue: recovered._sum.amount ?? 0,
    revenueAtRisk: atRiskValue._sum.estimatedValue ?? 0,
    leadRecoveryRate,
    conversionRate,
    responseTimeHours,
    statusRows,
    temperatureRows,
  };
}

export async function getRevenueMetrics(organizationId: string) {
  const [contacted, reactivated, qualified, wonEvents, normalWon, recoveredEvents, normalEvents, atRisk] = await Promise.all([
    db.campaignRecipient.count({
      where: { campaign: { organizationId }, status: { in: ["SENT", "RESPONDED"] } },
    }),
    db.lead.count({ where: { organizationId, isReactivated: true } }),
    db.lead.count({
      where: {
        organizationId,
        isReactivated: true,
        status: { in: ["QUALIFIED", "VIEWING_SCHEDULED", "NEGOTIATION", "WON"] },
      },
    }),
    db.revenueEvent.aggregate({
      where: { organizationId, type: "reactivated_won" },
      _sum: { amount: true },
      _count: true,
    }),
    db.revenueEvent.aggregate({
      where: { organizationId, type: "won" },
      _sum: { amount: true },
      _count: true,
    }),
    db.revenueEvent.findMany({
      where: { organizationId, type: "reactivated_won" },
      include: { lead: true },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
    db.revenueEvent.findMany({
      where: { organizationId, type: "won" },
      include: { lead: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.lead.aggregate({
      where: { organizationId, status: { in: ["DORMANT", "LOST"] } },
      _sum: { estimatedValue: true },
    }),
  ]);

  return {
    dormantContacted: contacted,
    reactivated,
    qualifiedRecovered: qualified,
    wonFromReactivated: wonEvents._count,
    recoveredRevenue: wonEvents._sum.amount ?? 0,
    normalRevenue: normalWon._sum.amount ?? 0,
    revenueAtRisk: atRisk._sum.estimatedValue ?? 0,
    events: recoveredEvents,
    normalEvents,
  };
}

export async function getTeamPerformance(organizationId: string) {
  const members = await db.membership.findMany({
    where: { organizationId },
    include: { user: true },
  });

  return Promise.all(
    members.map(async (member) => {
      const [handled, qualified, won, followUps, revenue, touches] = await Promise.all([
        db.lead.count({ where: { organizationId, assignedAgentId: member.userId } }),
        db.lead.count({
          where: {
            organizationId,
            assignedAgentId: member.userId,
            status: { in: ["QUALIFIED", "VIEWING_SCHEDULED", "NEGOTIATION", "WON"] },
          },
        }),
        db.lead.count({ where: { organizationId, assignedAgentId: member.userId, status: "WON" } }),
        db.followUp.count({
          where: { organizationId, assignedToId: member.userId, status: { in: ["SENT", "COMPLETED"] } },
        }),
        db.revenueEvent.aggregate({
          where: {
            organizationId,
            type: { in: ["won", "reactivated_won"] },
            lead: { assignedAgentId: member.userId },
          },
          _sum: { amount: true },
        }),
        db.lead.findMany({
          where: { organizationId, assignedAgentId: member.userId, lastContactedAt: { not: null } },
          select: { createdAt: true, lastContactedAt: true },
          take: 100,
        }),
      ]);
      const samples = touches
        .map((lead) =>
          lead.lastContactedAt
            ? (lead.lastContactedAt.getTime() - lead.createdAt.getTime()) / 36e5
            : null,
        )
        .filter((value): value is number => value != null && value >= 0 && value < 720);
      const hours = samples.length
        ? Math.round((samples.reduce((sum, value) => sum + value, 0) / samples.length) * 10) / 10
        : null;
      return {
        membershipId: member.id,
        user: member.user,
        role: member.role,
        handled,
        qualified,
        won,
        followUps,
        revenue: revenue._sum.amount ?? 0,
        responseTime: hours == null ? "—" : `${hours}h`,
      };
    }),
  );
}
