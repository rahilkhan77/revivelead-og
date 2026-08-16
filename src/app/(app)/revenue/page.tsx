import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/authz";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getRevenueMetrics } from "@/lib/metrics";

export default async function RevenuePage() {
  const user = await requireUser();
  const metrics = await getRevenueMetrics(user.organizationId);

  const cards = [
    { label: "Dormant leads contacted", value: metrics.dormantContacted },
    { label: "Leads reactivated", value: metrics.reactivated },
    { label: "Qualified recovered leads", value: metrics.qualifiedRecovered },
    { label: "Deals won from reactivated leads", value: metrics.wonFromReactivated },
    { label: "Revenue recovered", value: formatMoney(metrics.recoveredRevenue) },
    { label: "Normal revenue", value: formatMoney(metrics.normalRevenue) },
    { label: "Revenue at risk", value: formatMoney(metrics.revenueAtRisk) },
  ];

  return (
    <div>
      <PageHeader
        title="Revenue recovery"
        description="The commercial scoreboard: what you brought back from silent pipeline."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-medium">{card.value}</CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recovered revenue events</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Mark a reactivated lead as Won to record recovered revenue.</p>
          ) : (
            metrics.events.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{event.lead?.name ?? event.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.note} · {formatDateTime(event.createdAt)}
                  </p>
                </div>
                <p>{formatMoney(event.amount, event.currency)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
