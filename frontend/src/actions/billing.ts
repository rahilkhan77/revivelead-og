"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { appUrl } from "@/lib/app-url";
import { isPaddleEnabled } from "@/lib/billing/paddle";
import { getPaymentProvider, isBillingProviderEnabled } from "@/lib/billing/provider";
import {
  applyRazorpaySnapshot,
  fetchRazorpaySubscription,
  isRazorpayEnabled,
  notesRecord,
  verifyRazorpayPaymentSignature,
} from "@/lib/billing/razorpay";
import { db } from "@/lib/db";
import { billingPlanSchema } from "@/lib/billing/plans";
import { logSecurity } from "@/lib/log";
import { fail, ok, toErrorMessage, withUser } from "@/lib/safe-action";
const razorpayPaymentSchema = z.object({
  razorpay_payment_id: z.string().regex(/^pay_[A-Za-z0-9]+$/),
  razorpay_subscription_id: z.string().regex(/^sub_[A-Za-z0-9]+$/),
  razorpay_signature: z.string().min(32).max(128),
});

export async function startCheckoutAction(formData: FormData) {
  try {
    const user = await withUser({ policy: "billing" });
    if (user.role !== "OWNER") return fail("Only the owner can change billing.");
    const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    if (org.isDemo) return fail("The Al Noor demo tenant is not billed.");
    if (!isBillingProviderEnabled()) {
      return fail("A billing provider is not configured yet. Plans can still be switched locally from Billing.");
    }

    const parsedPlan = billingPlanSchema.safeParse(String(formData.get("plan") ?? "STARTER"));
    if (!parsedPlan.success) return fail("Invalid plan.");
    const plan = parsedPlan.data;

    const checkout = await getPaymentProvider().createCheckout({
      organizationId: org.id,
      organizationName: org.name,
      email: user.email,
      plan,
      successUrl: `${appUrl()}/billing`,
      cancelUrl: `${appUrl()}/billing`,
    });
    if (
      checkout.planUpdated ||
      (checkout.subscriptionId && checkout.keyId) ||
      checkout.url ||
      checkout.transactionId
    ) {
      return ok(checkout);
    }
    return fail("Checkout could not be created.");
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function verifyRazorpayCheckoutAction(formData: FormData) {
  try {
    const user = await withUser({ policy: "billing" });
    if (user.role !== "OWNER") return fail("Only the owner can change billing.");
    const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    if (org.isDemo) return fail("The Al Noor demo tenant is not billed.");
    if (!isRazorpayEnabled()) return fail("Razorpay is not configured.");

    const parsed = razorpayPaymentSchema.safeParse({
      razorpay_payment_id: String(formData.get("razorpay_payment_id") ?? "").trim(),
      razorpay_subscription_id: String(formData.get("razorpay_subscription_id") ?? "").trim(),
      razorpay_signature: String(formData.get("razorpay_signature") ?? "").trim(),
    });
    if (!parsed.success) return fail("Payment could not be verified.");

    const paymentId = parsed.data.razorpay_payment_id;
    const subscriptionId = parsed.data.razorpay_subscription_id;
    const signature = parsed.data.razorpay_signature;
    const secret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";
    if (!verifyRazorpayPaymentSignature({ paymentId, subscriptionId, signature, secret })) {
      logSecurity("billing.suspicious", { reason: "invalid_checkout_signature" });
      return fail("Payment could not be verified.");
    }

    const live = await fetchRazorpaySubscription(subscriptionId);
    const notes = notesRecord(live.notes);
    const attached = await db.subscription.findFirst({
      where: { organizationId: user.organizationId, provider: "razorpay", providerSubId: subscriptionId },
    });
    const orgMatch = notes.organizationId === user.organizationId || Boolean(attached);
    if (!orgMatch || (notes.organizationId && notes.organizationId !== user.organizationId)) {
      logSecurity("billing.suspicious", { reason: "subscription_org_mismatch" });
      return fail("This subscription does not belong to your agency.");
    }

    await applyRazorpaySnapshot(user.organizationId, live);
    const status = (await db.subscription.findUnique({ where: { organizationId: user.organizationId } }))?.status;
    revalidatePath("/billing");
    revalidatePath("/settings");
    return ok({
      status: status ?? "TRIALING",
      confirmed: status === "ACTIVE",
    });
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function openBillingPortalAction() {
  try {
    const user = await withUser({ policy: "billing" });
    if (user.role !== "OWNER") return fail("Only the owner can manage billing.");
    const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    if (org.isDemo) return fail("The Al Noor demo tenant is not billed.");
    if (isRazorpayEnabled()) {
      return fail("Razorpay billing is managed in ReviveLead. Use change plan, cancel, or resume on this page.");
    }
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
    const user = await withUser({ policy: "billing" });
    if (user.role !== "OWNER") return fail("Only the owner can cancel billing.");
    const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    if (org.isDemo) return fail("The Al Noor demo tenant is not billed.");
    const subscription = await db.subscription.findUnique({ where: { organizationId: user.organizationId } });
    if (!subscription?.providerSubId || !isBillingProviderEnabled()) {
      return fail("No live subscription is attached to this agency.");
    }
    const provider = getPaymentProvider();
    await provider.cancelSubscription(subscription.providerSubId);
    if (isRazorpayEnabled() && subscription.provider === "razorpay") {
      try {
        const live = await fetchRazorpaySubscription(subscription.providerSubId);
        await applyRazorpaySnapshot(user.organizationId, live);
      } catch {
        revalidatePath("/billing");
        return ok();
      }
    }
    revalidatePath("/billing");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}

export async function resumeSubscriptionAction() {
  try {
    const user = await withUser({ policy: "billing" });
    if (user.role !== "OWNER") return fail("Only the owner can resume billing.");
    const org = await db.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    if (org.isDemo) return fail("The Al Noor demo tenant is not billed.");
    if (!isRazorpayEnabled()) return fail("Resume is available for Razorpay subscriptions.");
    const subscription = await db.subscription.findUnique({ where: { organizationId: user.organizationId } });
    if (!subscription?.providerSubId || subscription.provider !== "razorpay") {
      return fail("No live Razorpay subscription is attached to this agency.");
    }
    const provider = getPaymentProvider();
    if (!provider.resumeSubscription) return fail("This billing provider cannot resume subscriptions.");
    await provider.resumeSubscription(subscription.providerSubId);
    const live = await fetchRazorpaySubscription(subscription.providerSubId);
    await applyRazorpaySnapshot(user.organizationId, live);
    revalidatePath("/billing");
    return ok();
  } catch (error) {
    return fail(toErrorMessage(error));
  }
}
