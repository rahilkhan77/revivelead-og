import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";
import { cronAuthorized } from "@/lib/org";
import { parseLeadCsv } from "@/lib/leads/csv";
import { ingestLead, leadVisibilityWhere } from "@/lib/leads/service";
import { executeFollowUp, scheduleLeadSequence } from "@/lib/follow-up/engine";
import { provisionOrganization } from "@/lib/onboarding/provision";
import { assertWithinLeadLimit, assertWithinAutomationLimit } from "@/lib/billing/plans";
import { WhatsAppProvider } from "@/lib/messaging/whatsapp";
import { handleInboundWhatsApp } from "@/lib/whatsapp/inbound";
import { sanitizeQualification } from "@/lib/ai/schema";
import { qualifyLead } from "@/lib/ai/qualify";
import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { createAgency } from "./helpers";

const suffix = `p2${Date.now()}`;

describe("ReviveLead phase 2 production flows", () => {
  let agency: Awaited<ReturnType<typeof createAgency>>;

  beforeAll(async () => {
    agency = await createAgency(`phase2-${suffix}`);
    await db.organization.update({
      where: { id: agency.organization.id },
      data: {
        settings: JSON.stringify({
          ...JSON.parse(agency.organization.settings),
          followUp: {
            ...JSON.parse(agency.organization.settings).followUp,
            respectBusinessHours: false,
          },
        }),
      },
    });
  });

  afterAll(async () => {
    await agency.cleanup();
  });

  it("provisions a new organization that is not the Al Noor demo tenant", async () => {
    const passwordHash = await hash("Test1234!", 10);
    const user = await db.user.create({
      data: {
        name: "New Owner",
        email: `new-owner-${suffix}@example.com`,
        passwordHash,
      },
    });
    const organization = await provisionOrganization({
      userId: user.id,
      name: "Gulf Horizon Realty",
      market: "Dubai",
      actorId: user.id,
    });
    expect(organization.slug).not.toBe("al-noor-properties");
    expect(organization.isDemo).toBe(false);
    expect(organization.onboardingCompleted).toBe(false);
    expect(organization.currency).toBe("AED");
    expect(organization.country).toBe("UAE");

    await db.automation.deleteMany({ where: { organizationId: organization.id } });
    await db.integration.deleteMany({ where: { organizationId: organization.id } });
    await db.subscription.deleteMany({ where: { organizationId: organization.id } });
    await db.auditLog.deleteMany({ where: { organizationId: organization.id } });
    await db.membership.deleteMany({ where: { organizationId: organization.id } });
    await db.organization.delete({ where: { id: organization.id } });
    await db.user.delete({ where: { id: user.id } });
  });

  it("keeps agent visibility scoped to assigned leads", async () => {
    const mine = await ingestLead({
      organizationId: agency.organization.id,
      name: "Agent Visible",
      phone: "+971509010001",
      assignedAgentId: agency.agent.id,
      skipAi: true,
    });
    const hidden = await ingestLead({
      organizationId: agency.organization.id,
      name: "Owner Only",
      phone: "+971509010002",
      assignedAgentId: agency.owner.id,
      skipAi: true,
    });
    const visible = await db.lead.findMany({
      where: leadVisibilityWhere(agency.organization.id, agency.agent.id, false),
    });
    expect(visible.some((lead) => lead.id === mine.id)).toBe(true);
    expect(visible.some((lead) => lead.id === hidden.id)).toBe(false);
  });

  it("parses CSV rows and reports malformed lines without crashing", () => {
    const rows = parseLeadCsv(
      "name,phone,email,source,propertyType,location,budget,currency,buyOrRent,timeline,notes\n" +
        "Sara,+971509010003,sara@example.com,Website,Apartment,JVC,1200000,AED,buy,This month,Ready\n" +
        ",not-a-phone,bad-email,,,,,,,",
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]?.valid).toBe(true);
    expect(rows[0]?.buyOrRent).toBe("BUYING");
    expect(rows[1]?.valid).toBe(false);
  });

  it("deduplicates leads by phone inside one organization", async () => {
    const first = await ingestLead({
      organizationId: agency.organization.id,
      name: "Duplicate One",
      phone: "+971509010004",
      email: `dup-${suffix}@example.com`,
      skipAi: true,
    });
    const second = await ingestLead({
      organizationId: agency.organization.id,
      name: "Duplicate Two",
      phone: "971509010004",
      notes: "Second enquiry",
      skipAi: true,
    });
    expect(second.id).toBe(first.id);
    expect(second.deduped).toBe(true);
    const count = await db.lead.count({
      where: { organizationId: agency.organization.id, phoneNormalized: first.phoneNormalized },
    });
    expect(first.phoneNormalized).toBeTruthy();
    expect(count).toBe(1);
  });

  it("creates a WhatsApp inbound lead and ignores duplicate provider IDs", async () => {
    const first = await handleInboundWhatsApp({
      organizationId: agency.organization.id,
      phone: "+971509010005",
      body: "Looking for a 2-bed in Dubai Marina",
      providerId: `wamid-${suffix}`,
      contactName: "Inbound Buyer",
    });
    const again = await handleInboundWhatsApp({
      organizationId: agency.organization.id,
      phone: "+971509010005",
      body: "Looking for a 2-bed in Dubai Marina",
      providerId: `wamid-${suffix}`,
      contactName: "Inbound Buyer",
    });
    expect(first.ok).toBe(true);
    expect(first.created).toBe(true);
    expect(again.duplicate).toBe(true);
    expect(again.leadId).toBe(first.leadId);
  });

  it("returns a sanitized error when WhatsApp Cloud API fails", async () => {
    await db.integration.create({
      data: {
        organizationId: agency.organization.id,
        type: "WHATSAPP",
        name: "WhatsApp Business",
        enabled: true,
        config: JSON.stringify({
          accessToken: "test-token",
          phoneNumberId: "123456",
        }),
      },
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "Bearer test-token invalid",
    }) as typeof fetch;
    try {
      const result = await new WhatsAppProvider().send({
        to: "+971509010006",
        body: "hello",
        leadId: "lead",
        organizationId: agency.organization.id,
      });
      expect(result.ok).toBe(false);
      expect(result.error).not.toContain("test-token");
    } finally {
      globalThis.fetch = originalFetch;
      await db.integration.deleteMany({
        where: { organizationId: agency.organization.id, type: "WHATSAPP" },
      });
    }
  });

  it("cancels pending follow-ups after a WhatsApp reply", async () => {
    const lead = await ingestLead({
      organizationId: agency.organization.id,
      name: "Reply Cancel",
      phone: "+971509010007",
      assignedAgentId: agency.agent.id,
      skipAi: true,
    });
    await handleInboundWhatsApp({
      organizationId: agency.organization.id,
      phone: "+971509010007",
      body: "Yes, send the options",
      providerId: `reply-${suffix}`,
    });
    const pending = await db.followUp.count({
      where: {
        leadId: lead.id,
        status: { in: ["PENDING", "PROCESSING"] },
        type: { in: ["NO_RESPONSE", "NEW_LEAD_RESPONSE"] },
      },
    });
    expect(pending).toBe(0);
  });

  it("does not schedule a second follow-up sequence", async () => {
    const lead = await ingestLead({
      organizationId: agency.organization.id,
      name: "Sequence Guard",
      phone: "+971509010008",
      skipAi: true,
    });
    const before = await db.followUp.count({ where: { leadId: lead.id } });
    await scheduleLeadSequence(lead, agency.organization.settings, "Asia/Dubai");
    const after = await db.followUp.count({ where: { leadId: lead.id } });
    expect(after).toBe(before);
  });

  it("uses the heuristic fallback and rejects invalid AI payloads", async () => {
    process.env.OPENAI_API_KEY = "";
    const result = await qualifyLead({
      name: "AI Fallback",
      location: "Arabian Ranches",
      budgetMax: 4500000,
      currency: "AED",
      intent: "BUYING",
    });
    expect(result.leadScore).toBeGreaterThanOrEqual(0);
    expect(result.leadScore).toBeLessThanOrEqual(100);
    const sanitized = sanitizeQualification({
      leadScore: 900,
      temperature: "NUCLEAR",
      currency: "AED",
      recommendedAction: "",
    });
    expect(sanitized.leadScore).toBeLessThanOrEqual(100);
    expect(sanitized.temperature).toMatch(/HOT|WARM|COLD/);
    expect(sanitized.currency).toBe("AED");
  });

  it("fails closed when CRON_SECRET is missing in production", () => {
    expect(cronAuthorized("", "anything", "production")).toBe(false);
    expect(cronAuthorized(undefined, "anything", "production")).toBe(false);
    expect(cronAuthorized("cron-test", "cron-test", "production")).toBe(true);
    expect(cronAuthorized("cron-test", "wrong", "production")).toBe(false);
    expect(cronAuthorized(undefined, "", "development")).toBe(true);
  });

  it("enforces billing lead and automation limits with an upgrade message", async () => {
    await db.subscription.update({
      where: { organizationId: agency.organization.id },
      data: { leadLimit: 0, automationLimit: 0 },
    });
    await expect(
      assertWithinLeadLimit(agency.organization.id),
    ).rejects.toThrow(/Upgrade/);
    await expect(
      assertWithinAutomationLimit(agency.organization.id),
    ).rejects.toThrow(/Upgrade/);
    await db.subscription.update({
      where: { organizationId: agency.organization.id },
      data: { leadLimit: 2000, automationLimit: 25 },
    });
  });

  it("marks a follow-up FAILED when WhatsApp send fails", async () => {
    const lead = await ingestLead({
      organizationId: agency.organization.id,
      name: "Failed Send",
      phone: "+971509010009",
      skipAi: true,
    });
    await db.integration.create({
      data: {
        organizationId: agency.organization.id,
        type: "WHATSAPP",
        name: "WhatsApp Business",
        enabled: true,
        config: JSON.stringify({ accessToken: "x", phoneNumberId: "1" }),
      },
    });
    const followUp = await db.followUp.findFirstOrThrow({
      where: { leadId: lead.id, type: "NEW_LEAD_RESPONSE" },
    });
    await db.followUp.update({
      where: { id: followUp.id },
      data: { status: "PROCESSING" },
    });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "upstream error",
    }) as typeof fetch;
    try {
      await executeFollowUp(followUp.id);
      const updated = await db.followUp.findUniqueOrThrow({ where: { id: followUp.id } });
      expect(updated.status).toBe("FAILED");
    } finally {
      globalThis.fetch = originalFetch;
      await db.integration.deleteMany({
        where: { organizationId: agency.organization.id, type: "WHATSAPP" },
      });
    }
  });
});
