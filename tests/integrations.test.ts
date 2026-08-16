import { createHash } from "crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createApiKey, resolveOrgFromApiKey } from "@/lib/api-keys";
import { resolveClerkToAppUser } from "@/lib/auth/provision-clerk";
import { handleChatTurn } from "@/lib/chat/engine";
import { autoMapColumns } from "@/lib/import/mapping";
import { detectAndPreview } from "@/lib/import/parse";
import { normalizePhone } from "@/lib/leads/normalize";
import { ingestLead } from "@/lib/leads/service";
import { searchProperties } from "@/lib/properties/service";
import { calculateRevenueRisk } from "@/lib/revenue/risk";
import { applyPaddleSubscription, mapPaddleStatus } from "@/lib/billing/paddle";
import { isOptOutMessage } from "@/lib/leads/opt-out";
import { claimWebhookEvent } from "@/lib/webhooks/idempotency";
import { db } from "@/lib/db";
import { createAgency } from "./helpers";

const suffix = `int${Date.now()}`;

describe("ReviveLead integrations and intelligence", () => {
  let agency: Awaited<ReturnType<typeof createAgency>>;
  let other: Awaited<ReturnType<typeof createAgency>>;

  beforeAll(async () => {
    agency = await createAgency(`int-a-${suffix}`);
    other = await createAgency(`int-b-${suffix}`);
  });

  afterAll(async () => {
    await agency.cleanup();
    await other.cleanup();
  });

  it("maps Clerk users onto internal User + Organization + OWNER membership", async () => {
    const appUser = await resolveClerkToAppUser({
      clerkId: `clerk_${suffix}`,
      email: `clerk-${suffix}@example.com`,
      name: "Clerk Owner",
    });
    expect(appUser?.role).toBe("OWNER");
    expect(appUser?.organizationName).not.toBe("Al Noor Properties");
    const membership = await db.membership.findFirst({
      where: { userId: appUser!.id, organizationId: appUser!.organizationId },
    });
    expect(membership?.role).toBe("OWNER");
    await db.automation.deleteMany({ where: { organizationId: appUser!.organizationId } });
    await db.integration.deleteMany({ where: { organizationId: appUser!.organizationId } });
    await db.subscription.deleteMany({ where: { organizationId: appUser!.organizationId } });
    await db.auditLog.deleteMany({ where: { organizationId: appUser!.organizationId } });
    await db.membership.deleteMany({ where: { organizationId: appUser!.organizationId } });
    await db.organization.delete({ where: { id: appUser!.organizationId } });
    await db.user.delete({ where: { id: appUser!.id } });
  });

  it("auto-maps messy real-estate column names", () => {
    const mapping = autoMapColumns(["Mobile Number", "Full Name", "Interested Area", "Max Budget"]);
    expect(mapping.phone).toBe("Mobile Number");
    expect(mapping.name).toBe("Full Name");
    expect(mapping.location).toBe("Interested Area");
    expect(mapping.budget).toBe("Max Budget");
  });

  it("normalizes phones and previews invalid import rows", () => {
    expect(normalizePhone("+971 50 123 4567")).toBeTruthy();
    expect(normalizePhone("+971501234567")).toBe(normalizePhone("971501234567"));
    const preview = detectAndPreview("Mobile Number,Full Name\n+971501234567,Sara\n,");
    expect(preview.rows[0]?.valid).toBe(true);
    expect(preview.rows[1]?.valid).toBe(false);
    const fixture = readFileSync(resolve("tests/fixtures/leads-import.csv"), "utf8");
    const fixturePreview = detectAndPreview(fixture);
    expect(fixturePreview.rows.filter((row) => row.valid)).toHaveLength(2);
    expect(fixturePreview.rows.some((row) => !row.valid)).toBe(true);
  });

  it("calculates labelled revenue-at-risk estimates from real lead fields", async () => {
    const lead = await ingestLead({
      organizationId: agency.organization.id,
      name: "Risk Lead",
      phone: "+971509020001",
      budgetMax: 2500000,
      location: "JVC",
      skipAi: true,
    });
    const risk = calculateRevenueRisk({ ...lead, status: "DORMANT", lastContactedAt: new Date(Date.now() - 40 * 86400000) });
    expect(risk.estimate).toBe(true);
    expect(risk.estimatedDealValue).toBe(2500000);
    expect(risk.revenueAtRisk).toBeGreaterThan(0);
    expect(risk.riskScore).toBeGreaterThan(0);
  });

  it("keeps chatbot sessions isolated by organization", async () => {
    await db.property.create({
      data: {
        organizationId: agency.organization.id,
        title: "Marina Test Apt",
        type: "Apartment",
        location: "Dubai Marina",
        bedrooms: 2,
        price: 1800000,
        status: "AVAILABLE",
      },
    });
    const result = await handleChatTurn({
      organizationId: agency.organization.id,
      message: "I want a 2BHK in Dubai Marina under AED 2 million. Name is Ahmed, phone +971509020002",
    });
    expect(result.sessionId).toBeTruthy();
    const leaked = await searchProperties({
      organizationId: other.organization.id,
      location: "Dubai Marina",
    });
    expect(leaked.some((item) => item.title === "Marina Test Apt")).toBe(false);
  });

  it("hashes API keys and resolves only the owning organization", async () => {
    const created = await createApiKey({
      organizationId: agency.organization.id,
      createdById: agency.owner.id,
      name: "n8n",
    });
    expect(created.secret.startsWith("rl_")).toBe(true);
    const stored = await db.apiKey.findUniqueOrThrow({ where: { id: created.id } });
    expect(stored.keyHash).toBe(createHash("sha256").update(created.secret).digest("hex"));
    expect(await resolveOrgFromApiKey(created.secret)).toBe(agency.organization.id);
    expect(await resolveOrgFromApiKey("rl_wrong")).toBeNull();
  });

  it("makes Paddle webhook event claims idempotent", async () => {
    const first = await claimWebhookEvent("paddle", `evt_${suffix}`);
    const second = await claimWebhookEvent("paddle", `evt_${suffix}`);
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("maps Paddle subscription status and persists provider ids", async () => {
    expect(mapPaddleStatus("active")).toBe("ACTIVE");
    expect(mapPaddleStatus("past_due")).toBe("PAST_DUE");
    expect(mapPaddleStatus("canceled")).toBe("CANCELED");
    await applyPaddleSubscription({
      organizationId: agency.organization.id,
      customerId: `ctm_${suffix}`,
      subscriptionId: `sub_${suffix}`,
      status: "active",
      billingPeriod: "month",
      currentPeriodEnd: new Date("2026-09-15T00:00:00.000Z"),
    });
    const subscription = await db.subscription.findUniqueOrThrow({
      where: { organizationId: agency.organization.id },
    });
    expect(subscription.provider).toBe("paddle");
    expect(subscription.providerCustomerId).toBe(`ctm_${suffix}`);
    expect(subscription.providerSubId).toBe(`sub_${suffix}`);
    expect(subscription.status).toBe("ACTIVE");
    expect(subscription.billingPeriod).toBe("month");
  });

  it("never bills the Al Noor demo organization through Paddle", async () => {
    await db.organization.update({
      where: { id: other.organization.id },
      data: { isDemo: true },
    });
    await applyPaddleSubscription({
      organizationId: other.organization.id,
      customerId: "ctm_demo",
      subscriptionId: "sub_demo",
      status: "active",
    });
    const subscription = await db.subscription.findUniqueOrThrow({
      where: { organizationId: other.organization.id },
    });
    expect(subscription.providerCustomerId).toBeNull();
    expect(subscription.provider).toBeNull();
  });

  it("detects WhatsApp opt-out keywords", () => {
    expect(isOptOutMessage("STOP")).toBe(true);
    expect(isOptOutMessage("unsubscribe")).toBe(true);
    expect(isOptOutMessage("still interested")).toBe(false);
  });
});
