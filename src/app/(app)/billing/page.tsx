import { PageHeader } from "@/components/page-header";
import { BillingPlans } from "@/components/billing-plans";
import { requireUser } from "@/lib/authz";
import { isPaddleEnabled } from "@/lib/billing/paddle";
import { getBillingUsage, PLANS } from "@/lib/billing/plans";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";

export default async function BillingPage() {
  const user = await requireUser();
  const usage = await getBillingUsage(user.organizationId);

  const bars = [
    { label: "Active leads", used: usage.activeLeads, limit: usage.leadLimit },
    { label: "Seats", used: usage.seatsUsed, limit: usage.seats },
    { label: "Automations", used: usage.automations, limit: usage.automationLimit },
    { label: "WhatsApp sends this period", used: usage.whatsappSent, limit: usage.whatsappMonthlyLimit },
  ];

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Plan limits are enforced in the product. Paddle is the payment provider and Merchant of Record."
      />
      <div className="mb-8 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="mt-1 text-2xl font-medium">{usage.plan}</p>
          <p className="mt-1 text-sm text-muted-foreground">Status: {usage.status}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Billing period: {usage.billingPeriod ?? "month"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Next billing date:{" "}
            {usage.currentPeriodEnd ? format(usage.currentPeriodEnd, "d MMM yyyy") : "Not scheduled"}
          </p>
        </div>
        {bars.map((bar) => {
          const pct = bar.limit ? Math.min(100, Math.round((bar.used / bar.limit) * 100)) : 0;
          return (
            <div key={bar.label} className="rounded-2xl border border-border p-4">
              <div className="mb-2 flex justify-between text-sm">
                <span>{bar.label}</span>
                <span className="text-muted-foreground">
                  {bar.used} / {bar.limit}
                </span>
              </div>
              <Progress value={pct} />
              {bar.used >= bar.limit ? (
                <p className="mt-2 text-sm text-destructive">Limit reached. Upgrade to continue.</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <BillingPlans
        plans={PLANS}
        current={usage.plan}
        isOwner={user.role === "OWNER"}
        seats={usage.seats}
        leadLimit={usage.leadLimit}
        paddleEnabled={isPaddleEnabled()}
        hasSubscription={Boolean(usage.status === "ACTIVE" || usage.status === "PAST_DUE" || usage.status === "TRIALING")}
      />
    </div>
  );
}
