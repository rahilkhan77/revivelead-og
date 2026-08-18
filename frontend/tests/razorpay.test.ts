import { createHmac } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as razorpayWebhook } from "@/app/api/webhooks/razorpay/route";
import {
  applyRazorpaySubscription,
  mapRazorpayStatus,
  markRazorpayPastDue,
  planFromRazorpayPlanId,
  razorpayWebhookEventId,
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/billing/razorpay";
import { db } from "@/lib/db";
import { claimWebhookEvent } from "@/lib/webhooks/idempotency";
import { createAgency } from "./helpers";

const suffix = `rzp${Date.now()}`;

describe("Razorpay billing", () => {
  let agency: Awaited<ReturnType<typeof createAgency>>;
  let demo: Awaited<ReturnType<typeof createAgency>>;

  beforeAll(async () => {
    agency = await createAgency(`rzp-a-${suffix}`);
    demo = await createAgency(`rzp-d-${suffix}`);
    await db.organization.update({
      where: { id: demo.organization.id },
      data: { isDemo: true },
    });
  });

  afterAll(async () => {
    await db.webhookEvent.deleteMany({ where: { provider: "razorpay", eventId: { contains: suffix } } });
    await agency.cleanup();
    await demo.cleanup();
  });

  it("maps Razorpay subscription statuses onto internal billing states", () => {
    expect(mapRazorpayStatus("created")).toBe("TRIALING");
    expect(mapRazorpayStatus("authenticated")).toBe("ACTIVE");
    expect(mapRazorpayStatus("active")).toBe("ACTIVE");
    expect(mapRazorpayStatus("pending")).toBe("PAST_DUE");
    expect(mapRazorpayStatus("halted")).toBe("PAST_DUE");
    expect(mapRazorpayStatus("paused")).toBe("PAST_DUE");
    expect(mapRazorpayStatus("cancelled")).toBe("CANCELED");
    expect(mapRazorpayStatus("completed")).toBe("CANCELED");
    expect(mapRazorpayStatus("expired")).toBe("CANCELED");
    expect(planFromRazorpayPlanId("plan_test_pro")).toBe("PRO");
    expect(planFromRazorpayPlanId("plan_test_starter")).toBe("STARTER");
  });

  it("verifies checkout and webhook signatures without printing secrets", () => {
    const secret = "unit_test_secret";
    const paymentId = "pay_unit";
    const subscriptionId = "sub_unit";
    const paymentSignature = createHmac("sha256", secret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");
    expect(
      verifyRazorpayPaymentSignature({
        paymentId,
        subscriptionId,
        signature: paymentSignature,
        secret,
      }),
    ).toBe(true);
    expect(
      verifyRazorpayPaymentSignature({
        paymentId,
        subscriptionId,
        signature: "deadbeef",
        secret,
      }),
    ).toBe(false);

    const body = `{"event":"subscription.activated","created_at":1}`;
    const webhookSignature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpayWebhookSignature(body, webhookSignature, secret)).toBe(true);
    expect(verifyRazorpayWebhookSignature(body, "00", secret)).toBe(false);
    expect(
      razorpayWebhookEventId(null, {
        event: "subscription.activated",
        created_at: 12,
        payload: { subscription: { entity: { id: "sub_1" } } },
      }),
    ).toBe("subscription.activated:sub_1:12");
  });

  it("makes Razorpay webhook event claims idempotent", async () => {
    const first = await claimWebhookEvent("razorpay", `evt_${suffix}`);
    const second = await claimWebhookEvent("razorpay", `evt_${suffix}`);
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it("persists Razorpay provider ids from a verified subscription snapshot", async () => {
    await applyRazorpaySubscription({
      organizationId: agency.organization.id,
      customerId: `cust_${suffix}`,
      subscriptionId: `sub_${suffix}`,
      status: "active",
      planId: "plan_test_pro",
      billingPeriod: "month",
      currentPeriodEnd: new Date("2026-09-15T00:00:00.000Z"),
    });
    const subscription = await db.subscription.findUniqueOrThrow({
      where: { organizationId: agency.organization.id },
    });
    expect(subscription.provider).toBe("razorpay");
    expect(subscription.providerCustomerId).toBe(`cust_${suffix}`);
    expect(subscription.providerSubId).toBe(`sub_${suffix}`);
    expect(subscription.status).toBe("ACTIVE");
    expect(subscription.plan).toBe("PRO");
  });

  it("never bills the Al Noor demo organization through Razorpay", async () => {
    await applyRazorpaySubscription({
      organizationId: demo.organization.id,
      customerId: "cust_demo",
      subscriptionId: "sub_demo",
      status: "active",
      planId: "plan_test_pro",
    });
    await markRazorpayPastDue(demo.organization.id);
    const subscription = await db.subscription.findUniqueOrThrow({
      where: { organizationId: demo.organization.id },
    });
    expect(subscription.providerCustomerId).toBeNull();
    expect(subscription.provider).toBeNull();
    expect(subscription.status).toBe("ACTIVE");
  });

  it("fails closed when the Razorpay webhook secret is missing", async () => {
    const previous = process.env.RAZORPAY_WEBHOOK_SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = "";
    try {
      const response = await razorpayWebhook(
        new Request("http://localhost/api/webhooks/razorpay", { method: "POST", body: "{}" }),
      );
      expect(response.status).toBe(503);
    } finally {
      process.env.RAZORPAY_WEBHOOK_SECRET = previous;
    }
  });

  it("rejects Razorpay webhooks with an invalid signature", async () => {
    const response = await razorpayWebhook(
      new Request("http://localhost/api/webhooks/razorpay", {
        method: "POST",
        headers: { "x-razorpay-signature": "deadbeef" },
        body: JSON.stringify({ event: "subscription.activated" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("applies a signed Razorpay webhook only once", async () => {
    const secret = "test_webhook_secret";
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    const body = JSON.stringify({
      event: "subscription.activated",
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        subscription: {
          entity: {
            id: `sub_wh_${suffix}`,
            plan_id: "plan_test_starter",
            customer_id: `cust_wh_${suffix}`,
            status: "active",
            current_end: 1787000000,
            notes: { organizationId: agency.organization.id, plan: "STARTER" },
          },
        },
      },
    });
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    const headers = {
      "x-razorpay-signature": signature,
      "x-razorpay-event-id": `evt_wh_${suffix}`,
    };
    const first = await razorpayWebhook(
      new Request("http://localhost/api/webhooks/razorpay", { method: "POST", headers, body }),
    );
    const second = await razorpayWebhook(
      new Request("http://localhost/api/webhooks/razorpay", { method: "POST", headers, body }),
    );
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ duplicate: true });
    const subscription = await db.subscription.findUniqueOrThrow({
      where: { organizationId: agency.organization.id },
    });
    expect(subscription.provider).toBe("razorpay");
    expect(subscription.plan).toBe("STARTER");
    expect(subscription.status).toBe("ACTIVE");
  });

  it("rejects stale Razorpay webhook events", async () => {
    const secret = "test_webhook_secret";
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    const body = JSON.stringify({
      event: "subscription.activated",
      created_at: 100,
      payload: {
        subscription: {
          entity: {
            id: `sub_stale_${suffix}`,
            status: "active",
            notes: { organizationId: agency.organization.id },
          },
        },
      },
    });
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    const response = await razorpayWebhook(
      new Request("http://localhost/api/webhooks/razorpay", {
        method: "POST",
        headers: { "x-razorpay-signature": signature, "x-razorpay-event-id": `evt_stale_${suffix}` },
        body,
      }),
    );
    expect(response.status).toBe(400);
  });
});
