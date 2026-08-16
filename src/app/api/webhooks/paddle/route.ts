import { EventName } from "@paddle/paddle-node-sdk";
import { NextResponse } from "next/server";
import { applyPaddleSubscription, getPaddle } from "@/lib/billing/paddle";
import { db } from "@/lib/db";
import { claimWebhookEvent } from "@/lib/webhooks/idempotency";

type PaddleEntity = {
  id?: string;
  customerId?: string;
  subscriptionId?: string | null;
  status?: string;
  customData?: Record<string, unknown> | null;
  items?: { price?: { id?: string } }[];
  currentBillingPeriod?: { endsAt?: string } | null;
  billingCycle?: { interval?: string } | null;
  nextBilledAt?: string | null;
};

function organizationIdFromCustomData(data: PaddleEntity) {
  const value = data.customData?.organizationId;
  return typeof value === "string" && value ? value : "";
}

function periodEnd(data: PaddleEntity) {
  const raw = data.currentBillingPeriod?.endsAt ?? data.nextBilledAt;
  return raw ? new Date(raw) : null;
}

export async function POST(request: Request) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "Paddle webhook is not configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("paddle-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: { eventId: string; eventType: string; data: PaddleEntity };
  try {
    const paddle = getPaddle();
    event = (await paddle.webhooks.unmarshal(raw, secret, signature)) as unknown as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!(await claimWebhookEvent("paddle", event.eventId))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const data = event.data ?? {};
  const customerId = typeof data.customerId === "string" ? data.customerId : null;
  const organizationId =
    organizationIdFromCustomData(data) ||
    (customerId
      ? (await db.subscription.findFirst({ where: { provider: "paddle", providerCustomerId: customerId } }))
          ?.organizationId
      : null);

  if (!organizationId) return NextResponse.json({ ok: true, ignored: true });

  const subscriptionId =
    event.eventType.startsWith("subscription.") && typeof data.id === "string"
      ? data.id
      : typeof data.subscriptionId === "string"
        ? data.subscriptionId
        : null;
  const priceId = data.items?.[0]?.price?.id ?? null;

  if (
    event.eventType === EventName.SubscriptionCreated ||
    event.eventType === EventName.SubscriptionActivated ||
    event.eventType === EventName.SubscriptionUpdated ||
    event.eventType === EventName.SubscriptionTrialing ||
    event.eventType === EventName.SubscriptionResumed ||
    event.eventType === EventName.TransactionCompleted
  ) {
    await applyPaddleSubscription({
      organizationId,
      customerId,
      subscriptionId,
      status: data.status ?? "active",
      priceId,
      billingPeriod: data.billingCycle?.interval ?? "month",
      currentPeriodEnd: periodEnd(data),
    });
  }

  if (event.eventType === EventName.SubscriptionCanceled || event.eventType === EventName.SubscriptionPaused) {
    await applyPaddleSubscription({
      organizationId,
      customerId,
      subscriptionId,
      status: "canceled",
      priceId,
      billingPeriod: data.billingCycle?.interval ?? "month",
      currentPeriodEnd: periodEnd(data),
    });
  }

  if (event.eventType === EventName.SubscriptionPastDue || event.eventType === EventName.TransactionPaymentFailed) {
    await applyPaddleSubscription({
      organizationId,
      customerId,
      subscriptionId,
      status: "past_due",
      priceId,
      billingPeriod: data.billingCycle?.interval ?? "month",
      currentPeriodEnd: periodEnd(data),
    });
  }

  return NextResponse.json({ ok: true });
}
