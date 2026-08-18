import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { billingPlanSchema } from "@/lib/billing/plans";
import { isStaleRazorpayEvent, verifyRazorpayWebhookSignature } from "@/lib/billing/razorpay";
import { AuthError, toErrorMessage } from "@/lib/errors";
import { sanitizeSearchQuery, tooManyRequests } from "@/lib/http";
import { parseSpreadsheet, validateImportRow } from "@/lib/import/parse";
import { rateLimit } from "@/lib/rate-limit";
import { inviteRoleSchema } from "@/lib/roles";
import { contentSecurityPolicy } from "@/lib/security-headers";
import { claimWebhookEvent } from "@/lib/webhooks/idempotency";
import { verifyMetaSignature } from "@/lib/whatsapp/inbound";

describe("production security controls", () => {
  it("does not claim empty webhook event ids", async () => {
    expect(await claimWebhookEvent("razorpay", "")).toBe(false);
    expect(await claimWebhookEvent("razorpay", "   ")).toBe(false);
  });

  it("treats missing and old Razorpay events as stale and verifies signatures", () => {
    expect(isStaleRazorpayEvent(undefined)).toBe(true);
    expect(isStaleRazorpayEvent(100)).toBe(true);
    expect(isStaleRazorpayEvent(Math.floor(Date.now() / 1000))).toBe(false);
    const body = '{"event":"subscription.activated"}';
    const secret = "unit_test_secret";
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpayWebhookSignature(body, signature, secret)).toBe(true);
    expect(verifyRazorpayWebhookSignature(body, "deadbeef", secret)).toBe(false);
  });

  it("rejects OWNER invites and unknown billing plans", () => {
    expect(inviteRoleSchema.safeParse("OWNER").success).toBe(false);
    expect(inviteRoleSchema.safeParse("SALES_AGENT").success).toBe(true);
    expect(billingPlanSchema.safeParse("ENTERPRISE").success).toBe(false);
    expect(billingPlanSchema.safeParse("PRO").success).toBe(true);
  });

  it("does not parse HTML or path-traversal filenames as CSV", async () => {
    const html = Buffer.from("<html><body>name,phone</body></html>");
    expect((await parseSpreadsheet(html, "../payload.html")).rows).toEqual([]);
    expect((await parseSpreadsheet(html, "leads.html")).rows).toEqual([]);
    expect((await parseSpreadsheet(Buffer.from("name,phone\nSara,+971501234567"), "leads.csv")).rows).toHaveLength(1);
  });

  it("revalidates import rows instead of trusting client valid flags", () => {
    const row = validateImportRow({
      line: 2,
      name: "A",
      valid: true,
    });
    expect(row.valid).toBe(false);
  });

  it("hides Prisma, connection, and oversized errors from clients", () => {
    expect(toErrorMessage(new Error("prisma: P1001 Can't reach database server"))).toBe("Something went wrong.");
    expect(toErrorMessage(new Error("Unique constraint failed on the fields: (`email`)"))).toBe("Something went wrong.");
    expect(toErrorMessage(new Error("ECONNREFUSED 127.0.0.1:5432"))).toBe("Something went wrong.");
    try {
      z.object({ a: z.string() }).parse({});
    } catch (error) {
      expect(toErrorMessage(error)).toBe("Invalid input.");
    }
    expect(toErrorMessage(new AuthError("You must be signed in."))).toBe("You must be signed in.");
  });

  it("rate-limits a key and returns HTTP 429 helpers", async () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    expect((await rateLimit(key, 2, 60_000)).ok).toBe(true);
    expect((await rateLimit(key, 2, 60_000)).ok).toBe(true);
    const blocked = await rateLimit(key, 2, 60_000);
    expect(blocked.ok).toBe(false);
    const response = tooManyRequests(30);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
  });

  it("keeps CSP compatible with Clerk and Razorpay", () => {
    const csp = contentSecurityPolicy();
    expect(csp).toContain("https://checkout.razorpay.com");
    expect(csp).toContain("https://*.clerk.com");
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("truncates search queries and rejects unsigned Meta signatures", () => {
    expect(sanitizeSearchQuery(` ${"a".repeat(200)} `)).toHaveLength(80);
    const raw = '{"object":"whatsapp_business_account"}';
    expect(verifyMetaSignature(raw, null, "secret")).toBe(false);
    expect(verifyMetaSignature(raw, "sha256=00", "secret")).toBe(false);
  });
});
