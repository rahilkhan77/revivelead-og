import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import type { Plan, SubscriptionStatus } from "@prisma/client";
import { getPlan } from "@/lib/billing/plans";
import { db } from "@/lib/db";
import type { PaymentCheckoutInput, PaymentCheckoutResult, PaymentProvider } from "@/lib/providers/types";

export function isPaddleEnabled() {
  return Boolean(process.env.PADDLE_API_KEY?.trim());
}

export function paddleEnvironment(): "sandbox" | "production" {
  return process.env.PADDLE_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export function paddlePriceId(plan: Plan) {
  if (plan === "STARTER") return process.env.PADDLE_PRICE_STARTER ?? "";
  if (plan === "PRO") return process.env.PADDLE_PRICE_PRO ?? "";
  return process.env.PADDLE_PRICE_ENTERPRISE ?? "";
}

export function getPaddle() {
  const key = process.env.PADDLE_API_KEY?.trim();
  if (!key) throw new Error("PADDLE_API_KEY is not set.");
  return new Paddle(key, {
    environment: paddleEnvironment() === "production" ? Environment.production : Environment.sandbox,
  });
}

export function planFromPaddlePrice(priceId?: string | null): Plan | null {
  if (!priceId) return null;
  if (priceId === process.env.PADDLE_PRICE_PRO) return "PRO";
  if (priceId === process.env.PADDLE_PRICE_ENTERPRISE) return "ENTERPRISE";
  if (priceId === process.env.PADDLE_PRICE_STARTER) return "STARTER";
  return null;
}

export function mapPaddleStatus(status?: string | null): SubscriptionStatus {
  if (status === "trialing") return "TRIALING";
  if (status === "active") return "ACTIVE";
  if (status === "past_due") return "PAST_DUE";
  if (status === "canceled" || status === "cancelled" || status === "paused") return "CANCELED";
  return "TRIALING";
}

export async function applyPaddleSubscription(input: {
  organizationId: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  status?: string | null;
  priceId?: string | null;
  billingPeriod?: string | null;
  currentPeriodEnd?: Date | null;
}) {
  const org = await db.organization.findUnique({ where: { id: input.organizationId } });
  if (!org || org.isDemo) return;

  const plan = planFromPaddlePrice(input.priceId) ?? "STARTER";
  const definition = getPlan(plan);
  const status = mapPaddleStatus(input.status);

  await db.subscription.upsert({
    where: { organizationId: input.organizationId },
    update: {
      plan,
      status,
      seats: definition.seats,
      leadLimit: definition.leadLimit,
      automationLimit: definition.automationLimit,
      whatsappMonthlyLimit: definition.whatsappMonthlyLimit,
      billingPeriod: input.billingPeriod ?? undefined,
      provider: "paddle",
      providerCustomerId: input.customerId ?? undefined,
      providerSubId: input.subscriptionId ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd,
    },
    create: {
      organizationId: input.organizationId,
      plan,
      status,
      seats: definition.seats,
      leadLimit: definition.leadLimit,
      automationLimit: definition.automationLimit,
      whatsappMonthlyLimit: definition.whatsappMonthlyLimit,
      billingPeriod: input.billingPeriod ?? "month",
      provider: "paddle",
      providerCustomerId: input.customerId ?? undefined,
      providerSubId: input.subscriptionId ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd,
    },
  });
}

export class PaddlePaymentProvider implements PaymentProvider {
  readonly name = "paddle";

  enabled() {
    return isPaddleEnabled();
  }

  async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
    const priceId = paddlePriceId(input.plan);
    if (!priceId) {
      throw new Error(
        input.plan === "ENTERPRISE"
          ? "Enterprise billing is arranged with ReviveLead. No self-serve Paddle price is configured."
          : "This plan does not have a Paddle price configured.",
      );
    }

    const paddle = getPaddle();
    const existing = await db.subscription.findUnique({ where: { organizationId: input.organizationId } });
    let customerId = existing?.providerCustomerId ?? undefined;

    if (!customerId) {
      if (!input.email) throw new Error("An email is required to create a Paddle customer.");
      const customer = await paddle.customers.create({
        email: input.email,
        name: input.organizationName,
        customData: { organizationId: input.organizationId },
      });
      customerId = customer.id;
      await db.subscription.update({
        where: { organizationId: input.organizationId },
        data: { provider: "paddle", providerCustomerId: customerId },
      });
    }

    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customerId,
      customData: { organizationId: input.organizationId, plan: input.plan },
    });

    return {
      url: transaction.checkout?.url ?? undefined,
      transactionId: transaction.id,
      clientToken: process.env.PADDLE_CLIENT_TOKEN || undefined,
      environment: paddleEnvironment(),
    };
  }

  async createPortalSession(input: { customerId: string; subscriptionId?: string | null }) {
    const paddle = getPaddle();
    const session = await paddle.customerPortalSessions.create(
      input.customerId,
      input.subscriptionId ? [input.subscriptionId] : [],
    );
    const url = session.urls.general.overview;
    if (!url) throw new Error("Paddle did not return a customer portal URL.");
    return { url };
  }

  async cancelSubscription(subscriptionId: string) {
    const paddle = getPaddle();
    await paddle.subscriptions.cancel(subscriptionId, { effectiveFrom: "next_billing_period" });
  }
}
