import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { requireUser, canViewAllLeads } from "@/lib/authz";
import { STATUS_LABELS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { getDashboardMetrics } from "@/lib/metrics";
import { leadVisibilityWhere } from "@/lib/leads/service";
import { db } from "@/lib/db";
import { StatusBadge, TemperatureBadge } from "@/components/status-badge";
import Link from "next/link";

const StatusChart = dynamic(
  () => import("@/components/dashboard-charts").then((mod) => mod.StatusChart),
  { loading: () => <div className="h-72 animate-pulse rounded-md bg-muted/60" /> },
);

export default async function DashboardPage() {
  const user = await requireUser();
  const [metrics, recent] = await Promise.all([
    getDashboardMetrics(user.organizationId, user.id, user.role),
    db.lead.findMany({
      where: leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)),
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        location: true,
        temperature: true,
        status: true,
        assignedAgent: { select: { name: true } },
      },
    }),
  ]);

  const primary = [
    { label: "Total leads", value: metrics.totalLeads },
    { label: "Hot leads", value: metrics.hotLeads },
    { label: "Follow-ups due", value: metrics.followUpsDue },
    { label: "Dormant leads", value: metrics.dormantLeads },
    { label: "Reactivated leads", value: metrics.reactivated },
    { label: "Qualified leads", value: metrics.qualified },
    { label: "Deals won", value: metrics.won },
    { label: "Revenue recovered", value: formatMoney(metrics.recoveredRevenue) },
  ];

  const recovery = [
    { label: "Revenue at risk", value: formatMoney(metrics.revenueAtRisk), hint: "Estimated value sitting in dormant and lost pipeline." },
    { label: "Revenue recovered", value: formatMoney(metrics.recoveredRevenue), hint: "Won deals that came back from reactivation." },
    { label: "Lead recovery rate", value: `${metrics.leadRecoveryRate}%`, hint: "Reactivated leads as a share of the dormant + reactivated pool." },
    { label: "Average response time", value: `${metrics.responseTimeHours}h`, hint: "From lead created to first recorded contact." },
  ];

  return (
    <div>
      <PageHeader
        title="How much revenue did ReviveLead recover?"
        description="Live agency scoreboard. Recovered revenue is only deals won after reactivation — never mixed with normal closings."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {primary.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-medium">{card.value}</CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {recovery.map((card) => (
          <Card key={card.label} className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline by status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChart
              data={metrics.statusRows.map((row) => ({
                status: STATUS_LABELS[row.status],
                count: row._count._all,
              }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open lead temperature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.temperatureRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open leads yet.</p>
            ) : (
              metrics.temperatureRows.map((row) => (
                <div key={row.temperature} className="flex items-center justify-between">
                  <TemperatureBadge value={row.temperature} />
                  <span className="text-sm">{row._count._all}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Latest opportunities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">New leads will appear here as soon as they are captured.</p>
          ) : (
            recent.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm transition-colors duration-150 hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lead.location} · {lead.assignedAgent?.name ?? "Unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TemperatureBadge value={lead.temperature} />
                  <StatusBadge status={lead.status} />
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
