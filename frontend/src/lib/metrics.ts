import { subDays } from "date-fns";
import { canViewAllLeads } from "@/lib/roles";
import { db } from "@/lib/db";
import { leadVisibilityWhere } from "@/lib/leads/service";
import type { LeadStatus, Role } from "@prisma/client";

const QUALIFIED_STATUSES: LeadStatus[] = ["QUALIFIED", "VIEWING_SCHEDULED", "NEGOTIATION"];
const TEAM_QUALIFIED_STATUSES: LeadStatus[] = [...QUALIFIED_STATUSES, "WON"];

function statusCount(rows: { status: LeadStatus; _count: { _all: number } }[], status: LeadStatus) {
  return rows.find((row) => row.status === status)?._count._all ?? 0;
}

export async function getDashboardMetrics(organizationId: string, userId: string, role: Role) {
  const where = leadVisibilityWhere(organizationId, userId, canViewAllLeads(role));
  const now = new Date();
  const weekAgo = subDays(now, 7);
  const followUpWhere = {
    organizationId,
    ...(canViewAllLeads(role) ? {} : { assignedToId: userId }),
  };

  const [followUpsDue, atRisk, reactivated, recovered, atRiskValue, firstTouches, statusRows, temperatureRows] =
    await Promise.all([
      db.followUp.count({
        where: { ...followUpWhere, status: "PENDING", dueAt: { lte: now } },
      }),
      db.lead.count({
        where: {
          ...where,
          status: { in: ["NEW", "CONTACTED", "DORMANT"] },
          OR: [{ lastContactedAt: { lte: weekAgo } }, { lastContactedAt: null, createdAt: { lte: weekAgo } }],
        },
      }),
      db.lead.count({ where: { ...where, isReactivated: true } }),
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
      db.lead.groupBy({
        by: ["status"],
        where,
        _count: { _all: true },
      }),
      db.lead.groupBy({
        by: ["temperature"],
        where: { ...where, status: { notIn: ["WON", "LOST"] } },
        _count: { _all: true },
      }),
    ]);

  const totalLeads = statusRows.reduce((sum, row) => sum + row._count._all, 0);
  const newLeads = statusCount(statusRows, "NEW");
  const dormantLeads = statusCount(statusRows, "DORMANT");
  const won = statusCount(statusRows, "WON");
  const qualified = QUALIFIED_STATUSES.reduce((sum, status) => sum + statusCount(statusRows, status), 0);
  const hotLeads = temperatureRows.find((row) => row.temperature === "HOT")?._count._all ?? 0;
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
  const [contacted, reactivated, qualified, wonEvents, normalWon, recoveredEvents, normalEvents, atRisk] =
    await Promise.all([
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
        select: {
          id: true,
          amount: true,
          currency: true,
          note: true,
          type: true,
          createdAt: true,
          lead: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.revenueEvent.findMany({
        where: { organizationId, type: "won" },
        select: {
          id: true,
          amount: true,
          currency: true,
          note: true,
          type: true,
          createdAt: true,
          lead: { select: { name: true } },
        },
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

function averageResponseHours(
  touches: { createdAt: Date; lastContactedAt: Date | null }[],
) {
  const samples = touches
    .map((lead) =>
      lead.lastContactedAt ? (lead.lastContactedAt.getTime() - lead.createdAt.getTime()) / 36e5 : null,
    )
    .filter((value): value is number => value != null && value >= 0 && value < 720);
  return samples.length
    ? Math.round((samples.reduce((sum, value) => sum + value, 0) / samples.length) * 10) / 10
    : null;
}

export async function getTeamPerformance(organizationId: string) {
  const members = await db.membership.findMany({
    where: { organizationId },
    select: {
      id: true,
      role: true,
      userId: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  const userIds = members.map((member) => member.userId);
  if (userIds.length === 0) return [];

  const [statusRows, followUpRows, revenueRows, touches] = await Promise.all([
    db.lead.groupBy({
      by: ["assignedAgentId", "status"],
      where: { organizationId, assignedAgentId: { in: userIds } },
      _count: { _all: true },
    }),
    db.followUp.groupBy({
      by: ["assignedToId"],
      where: { organizationId, assignedToId: { in: userIds }, status: { in: ["SENT", "COMPLETED"] } },
      _count: { _all: true },
    }),
    db.revenueEvent.findMany({
      where: { organizationId, type: { in: ["won", "reactivated_won"] } },
      select: { amount: true, lead: { select: { assignedAgentId: true } } },
    }),
    db.lead.findMany({
      where: { organizationId, assignedAgentId: { in: userIds }, lastContactedAt: { not: null } },
      select: { assignedAgentId: true, createdAt: true, lastContactedAt: true },
      take: Math.min(2000, 100 * userIds.length),
    }),
  ]);

  return members.map((member) => {
    const agentStatus = statusRows.filter((row) => row.assignedAgentId === member.userId);
    const handled = agentStatus.reduce((sum, row) => sum + row._count._all, 0);
    const qualified = agentStatus
      .filter((row) => TEAM_QUALIFIED_STATUSES.includes(row.status))
      .reduce((sum, row) => sum + row._count._all, 0);
    const won = agentStatus.filter((row) => row.status === "WON").reduce((sum, row) => sum + row._count._all, 0);
    const followUps = followUpRows.find((row) => row.assignedToId === member.userId)?._count._all ?? 0;
    const revenue = revenueRows
      .filter((row) => row.lead?.assignedAgentId === member.userId)
      .reduce((sum, row) => sum + row.amount, 0);
    const hours = averageResponseHours(
      touches.filter((lead) => lead.assignedAgentId === member.userId).slice(0, 100),
    );
    return {
      membershipId: member.id,
      user: member.user,
      role: member.role,
      handled,
      qualified,
      won,
      followUps,
      revenue,
      responseTime: hours == null ? "—" : `${hours}h`,
    };
  });
}
