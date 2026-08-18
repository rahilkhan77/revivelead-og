import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/authz";
import { formatMoney } from "@/lib/format";
import { getIntelligenceMetrics } from "@/lib/intelligence/metrics";

export default async function IntelligencePage() {
  const user = await requireUser();
  const metrics = await getIntelligenceMetrics(user.organizationId);

  const inventory = [
    { label: "Total leads", value: metrics.totalLeads },
    { label: "Active leads", value: metrics.activeLeads },
    { label: "Dormant leads", value: metrics.dormantLeads },
    { label: "Hot leads", value: metrics.hotLeads },
    { label: "Warm leads", value: metrics.warmLeads },
    { label: "Cold leads", value: metrics.coldLeads },
    { label: "Reactivation candidates", value: metrics.reactivationCandidates },
    { label: "High-value leads", value: metrics.highValueLeads },
  ];

  const business = [
    { label: "Revenue at risk (estimate)", value: formatMoney(metrics.revenueAtRisk), hint: "Modelled from score, dormancy and estimated deal value. Not guaranteed." },
    { label: "Estimated recoverable", value: formatMoney(metrics.estimatedRecoverable), hint: "Conservative share of revenue at risk." },
    { label: "Recovered revenue", value: formatMoney(metrics.recoveredRevenue), hint: "Won deals after reactivation only." },
    { label: "Lead recovery rate", value: `${metrics.leadRecoveryRate}%`, hint: "Reactivated leads as a share of dormant + reactivated." },
  ];

  const chat = [
    { label: "Visitors engaged", value: metrics.chatSessions },
    { label: "Leads captured", value: metrics.chatLeads },
    { label: "Agent handoffs", value: metrics.chatHandoffs },
    { label: "Chat conversion", value: `${metrics.chatConversion}%` },
  ];

  return (
    <div>
      <PageHeader
        title="Database intelligence"
        description="Your old leads are not dead. These numbers come from the agency database — estimates are labelled as estimates."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {inventory.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-medium">{card.value}</CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {business.map((card) => (
          <Card key={card.label} className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-medium">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <h2 className="mt-8 mb-3 text-sm font-medium">Website lead capture</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {chat.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-medium">{card.value}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
