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
import { clerkOAuthUrls } from "@/lib/auth/clerk-oauth";
import {
  clerkFrontendApiOriginFromPublishableKey,
  contentSecurityPolicy,
} from "@/lib/security-headers";

function cspDirective(csp: string, name: string) {
  const part = csp.split("; ").find((item) => item.startsWith(`${name} `));
  expect(part).toBeTruthy();
  return part as string;
}
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

  it("keeps CSP compatible with Clerk, Razorpay, and Google OAuth", () => {
    const csp = contentSecurityPolicy({
      clerkFrontendApi: "https://clerk.frontend-2-gray.vercel.app",
    });
    expect(csp).toContain("https://checkout.razorpay.com");
    expect(csp).toContain("https://*.clerk.com");
    expect(csp).toContain("https://accounts.google.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/default-src \*/);
    expect(csp).not.toMatch(/script-src \*/);
    expect(csp).not.toMatch(/connect-src \*/);

    const formAction = cspDirective(csp, "form-action");
    expect(formAction).toContain("'self'");
    expect(formAction).toContain("https://clerk.frontend-2-gray.vercel.app");
    expect(formAction).toContain("https://*.clerk.accounts.dev");
    expect(formAction).toContain("https://accounts.google.com");
    expect(formAction).toContain("https://*.google.com");
    expect(formAction).toContain("https://*.shared.lcl.dev");

    const scriptSrc = cspDirective(csp, "script-src");
    expect(scriptSrc).toContain("https://clerk.frontend-2-gray.vercel.app");
    expect(scriptSrc).toContain("https://*.protect.clerk.com");
    expect(scriptSrc).toContain("https://challenges.cloudflare.com");

    const connectSrc = cspDirective(csp, "connect-src");
    expect(connectSrc).toContain("https://clerk.frontend-2-gray.vercel.app");
    expect(connectSrc).toContain("wss://clerk.frontend-2-gray.vercel.app");
    expect(connectSrc).toContain("https://*.protect.clerk.com");
    expect(connectSrc).toContain("https://*.clerk-telemetry.com");

    const frameSrc = cspDirective(csp, "frame-src");
    expect(frameSrc).toContain("'self'");
    expect(frameSrc).toContain("https://*.protect.clerk.com");
    expect(frameSrc).toContain("https://challenges.cloudflare.com");
    expect(frameSrc).toContain("https://accounts.google.com");

    const imgSrc = cspDirective(csp, "img-src");
    expect(imgSrc).toContain("https://img.clerk.com");
    expect(imgSrc).toContain("https://*.protect.clerk.com");
    expect(imgSrc).toContain("https://challenges.cloudflare.com");
  });

  it("decodes the Clerk Frontend API host from a publishable key", () => {
    const encoded = Buffer.from("clerk.frontend-2-gray.vercel.app$").toString("base64");
    expect(clerkFrontendApiOriginFromPublishableKey(`pk_live_${encoded}`)).toBe(
      "https://clerk.frontend-2-gray.vercel.app",
    );
  });

  it("builds absolute Clerk OAuth URLs from the current origin", () => {
    const signUp = clerkOAuthUrls("https://revivelead-og.vercel.app", "/sign-up/sso-callback", "/onboarding");
    expect(signUp.redirectCallbackUrl).toBe("https://revivelead-og.vercel.app/sign-up/sso-callback");
    expect(signUp.redirectUrl).toBe("https://revivelead-og.vercel.app/onboarding");
    const signIn = clerkOAuthUrls("https://revivelead-og.vercel.app", "/sign-in/sso-callback", "/dashboard");
    expect(signIn.redirectCallbackUrl).toBe("https://revivelead-og.vercel.app/sign-in/sso-callback");
    expect(signIn.redirectUrl).toBe("https://revivelead-og.vercel.app/dashboard");
    expect(signUp.redirectCallbackUrl).not.toContain("localhost");
    expect(signUp.redirectUrl).not.toContain("localhost");
  });

  it("truncates search queries and rejects unsigned Meta signatures", () => {
    expect(sanitizeSearchQuery(` ${"a".repeat(200)} `)).toHaveLength(80);
    const raw = '{"object":"whatsapp_business_account"}';
    expect(verifyMetaSignature(raw, null, "secret")).toBe(false);
    expect(verifyMetaSignature(raw, "sha256=00", "secret")).toBe(false);
  });
});
