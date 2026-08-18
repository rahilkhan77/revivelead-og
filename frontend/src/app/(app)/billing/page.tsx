import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { BillingPlans } from "@/components/billing-plans";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/lib/authz";
import { isPaddleEnabled } from "@/lib/billing/paddle";
import { getBillingUsage, PLANS } from "@/lib/billing/plans";
import { isRazorpayEnabled, isRazorpayWebhookConfigured, listRazorpayInvoices } from "@/lib/billing/razorpay";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export default async function BillingPage() {
  const user = await requireUser();
  const [usage, subscription, org] = await Promise.all([
    getBillingUsage(user.organizationId),
    db.subscription.findUnique({ where: { organizationId: user.organizationId } }),
    db.organization.findUnique({
      where: { id: user.organizationId },
      select: { isDemo: true },
    }),
  ]);

  const razorpayEnabled = isRazorpayEnabled();
  const provider = razorpayEnabled ? "razorpay" : isPaddleEnabled() ? "paddle" : "none";
  const invoices =
    razorpayEnabled && subscription?.provider === "razorpay" && subscription.providerSubId && !org?.isDemo
      ? await listRazorpayInvoices(subscription.providerSubId)
      : [];

  const bars = [
    { label: "Active leads", used: usage.activeLeads, limit: usage.leadLimit },
    { label: "Seats", used: usage.seatsUsed, limit: usage.seats },
    { label: "Automations", used: usage.automations, limit: usage.automationLimit },
    { label: "WhatsApp sends this period", used: usage.whatsappSent, limit: usage.whatsappMonthlyLimit },
  ];

  const paymentLabel =
    usage.status === "ACTIVE"
      ? "Paid"
      : usage.status === "PAST_DUE"
        ? "Payment failed"
        : usage.status === "CANCELED"
          ? "Cancelled"
          : "Awaiting payment";

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Plan limits are enforced in the product. Paid access is confirmed on the server after Razorpay verification."
      />
      {razorpayEnabled && !isRazorpayWebhookConfigured() && user.role === "OWNER" ? (
        <div className="mb-6 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Razorpay checkout verification is live. Recurring webhook sync is waiting for{" "}
          <code>RAZORPAY_WEBHOOK_SECRET</code>. Set that secret in the Razorpay dashboard webhook at{" "}
          <code>/api/webhooks/razorpay</code>, then add it to the server environment.
        </div>
      ) : null}
      {org?.isDemo ? (
        <div className="mb-6 rounded-lg border border-border p-4 text-sm text-muted-foreground">
          The Al Noor demo tenant is never billed.
        </div>
      ) : null}
      <div className="mb-8 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Current plan</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="text-2xl font-medium">{usage.plan}</p>
            <Badge variant="outline">{usage.status}</Badge>
            <Badge variant={usage.status === "ACTIVE" ? "default" : usage.status === "PAST_DUE" ? "destructive" : "secondary"}>
              {paymentLabel}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Billing period: {usage.billingPeriod ?? "month"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Next billing date: {usage.currentPeriodEnd ? format(usage.currentPeriodEnd, "d MMM yyyy") : "Not scheduled"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Provider: {subscription?.provider === "razorpay" ? "Razorpay" : subscription?.provider === "paddle" ? "Paddle" : "Not attached"}
          </p>
        </div>
        {bars.map((bar) => {
          const pct = bar.limit ? Math.min(100, Math.round((bar.used / bar.limit) * 100)) : 0;
          return (
            <div key={bar.label} className="rounded-lg border border-border p-4">
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
        currentStatus={usage.status}
        isOwner={user.role === "OWNER"}
        seats={usage.seats}
        leadLimit={usage.leadLimit}
        provider={provider}
        hasLiveSubscription={Boolean(
          subscription?.providerSubId &&
            (usage.status === "ACTIVE" || usage.status === "PAST_DUE" || usage.status === "TRIALING"),
        )}
        canResume={Boolean(
          razorpayEnabled &&
            subscription?.provider === "razorpay" &&
            subscription.providerSubId &&
            usage.status === "PAST_DUE",
        )}
      />
      <div className="mt-10">
        <h2 className="text-lg font-medium">Payment history</h2>
        <p className="mt-1 text-sm text-muted-foreground">Invoices are loaded from Razorpay. This page does not trust browser payment events.</p>
        <div className="mt-4 rounded-lg border border-border">
          {invoices.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{invoice.paidAt ? format(invoice.paidAt, "d MMM yyyy") : "—"}</TableCell>
                    <TableCell className="capitalize">{invoice.status}</TableCell>
                    <TableCell>{formatMoney(invoice.amount / 100, invoice.currency || "USD")}</TableCell>
                    <TableCell>
                      {invoice.invoiceUrl ? (
                        <a className="underline underline-offset-4" href={invoice.invoiceUrl} target="_blank" rel="noreferrer">
                          View invoice
                        </a>
                      ) : (
                        invoice.paymentId ?? "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
