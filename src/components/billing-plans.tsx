"use client";

import { useRouter } from "next/navigation";
import { cancelSubscriptionAction, openBillingPortalAction, startCheckoutAction } from "@/actions/billing";
import { changePlanAction } from "@/actions/settings";
import { openPaddleCheckout } from "@/components/paddle-checkout";
import { Button } from "@/components/ui/button";
import type { PlanDefinition } from "@/lib/billing/plans";
import { toast } from "sonner";

export function BillingPlans({
  plans,
  current,
  isOwner,
  seats,
  leadLimit,
  paddleEnabled,
  hasSubscription,
}: {
  plans: PlanDefinition[];
  current: string;
  isOwner: boolean;
  seats: number;
  leadLimit: number;
  paddleEnabled: boolean;
  hasSubscription: boolean;
}) {
  const router = useRouter();

  return (
    <div>
      <p className="mb-6 text-sm text-muted-foreground">
        Current envelope: {seats} seats · {leadLimit} active leads.{" "}
        {paddleEnabled
          ? "Paddle is the Merchant of Record. Subscription state is updated from verified webhooks."
          : "Paddle is not configured yet, so the owner can switch plans locally."}{" "}
        The Al Noor demo is never billed.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-2xl border border-border p-5">
            <p className="text-sm text-muted-foreground">{plan.name}</p>
            <p className="mt-2 text-2xl font-medium">
              {plan.priceMonthly ? `$${plan.priceMonthly}/mo` : "Custom"}
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Button
              className="mt-5"
              variant={current === plan.id ? "secondary" : "default"}
              disabled={!isOwner || current === plan.id}
              onClick={async () => {
                const form = new FormData();
                form.set("plan", plan.id);
                const checkout = await startCheckoutAction(form);
                if (checkout.ok && checkout.data?.url) {
                  window.location.href = checkout.data.url;
                  return;
                }
                if (checkout.ok && checkout.data?.transactionId && checkout.data.clientToken) {
                  try {
                    await openPaddleCheckout({
                      transactionId: checkout.data.transactionId,
                      clientToken: checkout.data.clientToken,
                      environment: checkout.data.environment ?? "sandbox",
                    });
                    return;
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to open Paddle checkout.");
                    return;
                  }
                }
                if (paddleEnabled) {
                  toast.error(checkout.error ?? "Unable to start Paddle checkout.");
                  return;
                }
                const result = await changePlanAction(form);
                if (!result.ok) toast.error(checkout.error ?? result.error);
                else {
                  toast.success(`Moved to ${plan.name}`);
                  router.refresh();
                }
              }}
            >
              {current === plan.id ? "Current plan" : plan.priceMonthly ? `Upgrade to ${plan.name}` : `Talk to us`}
            </Button>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={!isOwner}
          onClick={async () => {
            const result = await openBillingPortalAction();
            if (!result.ok) toast.error(result.error);
            else if (result.data?.url) window.location.href = result.data.url;
          }}
        >
          Manage billing
        </Button>
        <Button
          variant="ghost"
          disabled={!isOwner || !hasSubscription}
          onClick={async () => {
            if (!window.confirm("Cancel this subscription at the end of the current billing period?")) return;
            const result = await cancelSubscriptionAction();
            if (!result.ok) toast.error(result.error);
            else {
              toast.success("Cancellation requested. Access continues until the period ends.");
              router.refresh();
            }
          }}
        >
          Cancel subscription
        </Button>
      </div>
    </div>
  );
}
