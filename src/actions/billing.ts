"use server";

import { revalidatePath } from "next/cache";
import { appUrl } from "@/lib/app-url";
import { isPaddleEnabled } from "@/lib/billing/paddle";
import { getPaymentProvider } from "@/lib/billing/provider";
import { db } from "@/lib/db";
import { fail, ok, toErrorMessage, withUser } from "@/lib/safe-action";
import type { Plan } from "@prisma/client";

export async function startCheckoutAction(formData: FormData) {
  try {
    const user = await withUser();
    if (user.role !== "OWNER") return fail("Only the owner can change billing.");
    const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    if (org.isDemo) return fail("The Al Noor demo tenant is not billed.");
    if (!isPaddleEnabled()) {
      return fail("Paddle is not configured yet. Plans can still be switched locally from Billing.");
    }

    const plan = String(formData.get("plan") ?? "STARTER") as Plan;
    const checkout = await getPaymentProvider().createCheckout({
      organizationId: org.id,
      organizationName: org.name,
      email: user.email,
      plan,
      successUrl: `${appUrl()}/billing?checkout=success`,
      cancelUrl: `${appUrl()}/billing?checkout=cancelled`,
    });
    if (!checkout.url && !checkout.transactionId) {
      return fail("Paddle did not return a checkout session.");
    }
    return ok(checkout);
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function openBillingPortalAction() {
  try {
    const user = await withUser();
    if (user.role !== "OWNER") return fail("Only the owner can manage billing.");
    const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    if (org.isDemo) return fail("The Al Noor demo tenant is not billed.");
    const subscription = await db.subscription.findUnique({ where: { organizationId: user.organizationId } });
    if (!subscription?.providerCustomerId || !isPaddleEnabled()) {
      return fail("No Paddle customer is attached to this agency yet.");
    }
    const portal = await getPaymentProvider().createPortalSession({
      customerId: subscription.providerCustomerId,
      subscriptionId: subscription.providerSubId,
    });
    return ok({ url: portal.url });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function cancelSubscriptionAction() {
  try {
    const user = await withUser();
    if (user.role !== "OWNER") return fail("Only the owner can cancel billing.");
    const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    if (org.isDemo) return fail("The Al Noor demo tenant is not billed.");
    const subscription = await db.subscription.findUnique({ where: { organizationId: user.organizationId } });
    if (!subscription?.providerSubId || !isPaddleEnabled()) {
      return fail("No live Paddle subscription is attached to this agency.");
    }
    await getPaymentProvider().cancelSubscription(subscription.providerSubId);
    revalidatePath("/billing");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
