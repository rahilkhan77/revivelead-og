import { compare } from "bcryptjs";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { qualifyLead } from "@/lib/ai/qualify";
import { sanitizeQualification } from "@/lib/ai/schema";
import { runAutomations } from "@/lib/automations/engine";
import { cancelOpenFollowUps, scheduleLeadSequence } from "@/lib/follow-up/engine";
import { ingestLead, receiveLeadReply, updateLeadStatus } from "@/lib/leads/service";
import { getDashboardMetrics, getRevenueMetrics } from "@/lib/metrics";
import { createAgency } from "./helpers";

const suffix = `t${Date.now()}`;

describe("ReviveLead core flows", () => {
  let alpha: Awaited<ReturnType<typeof createAgency>>;
  let beta: Awaited<ReturnType<typeof createAgency>>;

  beforeAll(async () => {
    alpha = await createAgency(`alpha-${suffix}`);
    beta = await createAgency(`beta-${suffix}`);
  });

  afterAll(async () => {
    await alpha.cleanup();
    await beta.cleanup();
  });

  it("authenticates a user with a stored password hash", async () => {
    const user = await db.user.findUniqueOrThrow({ where: { id: alpha.owner.id } });
    expect(user.passwordHash).toBeTruthy();
    await expect(compare("Test1234!", user.passwordHash!)).resolves.toBe(true);
    await expect(compare("wrong-password", user.passwordHash!)).resolves.toBe(false);
    const membership = await db.membership.findFirst({
      where: { userId: user.id, organizationId: alpha.organization.id },
    });
    expect(membership?.role).toBe("OWNER");
  });

  it("keeps organization data isolated", async () => {
    const leadA = await ingestLead({
      organizationId: alpha.organization.id,
      name: "Alpha Buyer",
      phone: "+971501111111",
      location: "Dubai Marina",
      assignedAgentId: alpha.agent.id,
      skipAi: true,
    });
    const leadB = await ingestLead({
      organizationId: beta.organization.id,
      name: "Beta Buyer",
      phone: "+971502222222",
      location: "Downtown Dubai",
      assignedAgentId: beta.agent.id,
      skipAi: true,
    });

    const leaked = await db.lead.findFirst({
      where: { id: leadA.id, organizationId: beta.organization.id },
    });
    expect(leaked).toBeNull();

    const alphaLeads = await db.lead.findMany({
      where: { organizationId: alpha.organization.id },
    });
    expect(alphaLeads.every((lead) => lead.organizationId === alpha.organization.id)).toBe(true);
    expect(alphaLeads.some((lead) => lead.id === leadB.id)).toBe(false);
  });

  it("creates a lead, qualifies it, and assigns an agent", async () => {
    process.env.OPENAI_API_KEY = "";
    const lead = await ingestLead({
      organizationId: alpha.organization.id,
      name: "Hassan Test",
      phone: "+971503333333",
      location: "Palm Jumeirah",
      propertyType: "Villa",
      budgetMax: 18000000,
      intent: "BUYING",
      timeline: "This week",
      notes: "Ready to view ASAP, cash buyer",
    });
    expect(lead.assignedAgentId).toBeTruthy();
    expect(lead.leadScore).toBeGreaterThan(0);
    expect(["HOT", "WARM", "COLD"]).toContain(lead.temperature);
    const followUps = await db.followUp.findMany({
      where: { leadId: lead.id, organizationId: alpha.organization.id },
    });
    expect(followUps.length).toBeGreaterThanOrEqual(4);
  });

  it("falls back safely when AI output is invalid", async () => {
    process.env.OPENAI_API_KEY = "";
    const result = await qualifyLead({
      name: "Layla",
      location: "Business Bay",
      budgetMax: 1600000,
      intent: "BUYING",
    });
    expect(result.leadScore).toBeGreaterThanOrEqual(0);
    expect(result.leadScore).toBeLessThanOrEqual(100);

    const sanitized = sanitizeQualification({
      leadScore: "not-a-number",
      temperature: "BLAZING",
      intent: "MAYBE",
      recommendedAction: null,
      budgetMax: "abc",
    });
    expect(sanitized.leadScore).toBeGreaterThanOrEqual(0);
    expect(sanitized.temperature).toMatch(/HOT|WARM|COLD/);
    expect(sanitized.intent).toBe("UNKNOWN");
    expect(sanitized.recommendedAction.length).toBeGreaterThan(0);
  });

  it("cancels pending follow-ups when a lead replies and notifies the agent", async () => {
    const lead = await ingestLead({
      organizationId: alpha.organization.id,
      name: "Reply Test",
      phone: "+971504444444",
      assignedAgentId: alpha.agent.id,
      skipAi: true,
    });
    await receiveLeadReply({
      organizationId: alpha.organization.id,
      leadId: lead.id,
      body: "Can we view the Marina apartment tomorrow?",
    });
    const pending = await db.followUp.count({
      where: {
        leadId: lead.id,
        status: "PENDING",
        type: { in: ["NO_RESPONSE", "NEW_LEAD_RESPONSE"] },
      },
    });
    expect(pending).toBe(0);
    const notice = await db.notification.findFirst({
      where: { userId: alpha.agent.id, type: "LEAD_REPLIED" },
    });
    expect(notice).toBeTruthy();
  });

  it("does not create a duplicate follow-up sequence", async () => {
    const lead = await ingestLead({
      organizationId: alpha.organization.id,
      name: "Dup Sequence",
      phone: "+971505555555",
      skipAi: true,
    });
    const before = await db.followUp.count({ where: { leadId: lead.id } });
    await scheduleLeadSequence(lead, alpha.organization.settings);
    const after = await db.followUp.count({ where: { leadId: lead.id } });
    expect(after).toBe(before);
  });

  it("logs failed automation executions instead of swallowing them", async () => {
    const lead = await ingestLead({
      organizationId: alpha.organization.id,
      name: "Automation Test",
      phone: "+971506666666",
      skipAi: true,
    });
    const automation = await db.automation.create({
      data: {
        organizationId: alpha.organization.id,
        name: "Assign outsider",
        trigger: "LEAD_CREATED",
        action: "ASSIGN_AGENT",
        config: JSON.stringify({ agentId: beta.agent.id }),
      },
    });
    await runAutomations(alpha.organization.id, "LEAD_CREATED", lead.id);
    const execution = await db.automationExecution.findFirst({
      where: { automationId: automation.id, leadId: lead.id },
      orderBy: { createdAt: "desc" },
    });
    expect(execution?.status).toBe("failed");
    expect(execution?.result).toContain("organization");
  });

  it("records a revenue event once when a deal is won", async () => {
    const lead = await ingestLead({
      organizationId: alpha.organization.id,
      name: "Won Deal",
      phone: "+971507777777",
      budgetMax: 2200000,
      skipAi: true,
    });
    await db.lead.update({
      where: { id: lead.id },
      data: { isReactivated: true, estimatedValue: 2200000 },
    });
    await updateLeadStatus({
      organizationId: alpha.organization.id,
      leadId: lead.id,
      status: "WON",
    });
    await updateLeadStatus({
      organizationId: alpha.organization.id,
      leadId: lead.id,
      status: "WON",
    });
    const events = await db.revenueEvent.findMany({
      where: { leadId: lead.id, type: "reactivated_won" },
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.amount).toBe(2200000);
  });

  it("calculates revenue recovery from database records", async () => {
    const metrics = await getRevenueMetrics(alpha.organization.id);
    const dashboard = await getDashboardMetrics(
      alpha.organization.id,
      alpha.owner.id,
      "OWNER",
    );
    expect(metrics.recoveredRevenue).toBeGreaterThan(0);
    expect(dashboard.recoveredRevenue).toBe(metrics.recoveredRevenue);
    expect(dashboard.totalLeads).toBeGreaterThan(0);
    const foreign = await getRevenueMetrics(beta.organization.id);
    expect(foreign.recoveredRevenue).toBe(0);
  });

  it("lets cancelOpenFollowUps stay scoped to one organization", async () => {
    const lead = await ingestLead({
      organizationId: beta.organization.id,
      name: "Beta Follow",
      phone: "+971508888888",
      skipAi: true,
    });
    await cancelOpenFollowUps(lead.id, alpha.organization.id);
    const stillPending = await db.followUp.count({
      where: { leadId: lead.id, organizationId: beta.organization.id, status: "PENDING" },
    });
    expect(stillPending).toBeGreaterThan(0);
  });
});
