import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ReactivationStudio } from "@/components/reactivation-studio";
import { requireRole } from "@/lib/authz";
import { MANAGER_ROLES } from "@/lib/constants";
import { formatRelative } from "@/lib/format";
import { db } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";

export default async function ReactivationPage() {
  const user = await requireRole(MANAGER_ROLES);
  const dormant = await db.lead.findMany({
    where: {
      organizationId: user.organizationId,
      status: { in: ["DORMANT", "LOST"] },
    },
    orderBy: { lastContactedAt: "asc" },
  });
  const campaigns = await db.campaign.findMany({
    where: { organizationId: user.organizationId },
    include: { recipients: { include: { lead: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Old lead reactivation"
        description="Filter silent leads, preview AI messages, approve and track responses."
      />
      <ReactivationStudio />
      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-medium">Dormant and lost</h2>
          {dormant.length === 0 ? (
            <EmptyState title="No dormant leads" description="The engine marks leads silent for 30+ days as dormant." />
          ) : (
            <div className="space-y-2">
              {dormant.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lead.location} · last touch {formatRelative(lead.lastContactedAt)}
                    </p>
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-3 text-sm font-medium">Campaigns</h2>
          {campaigns.length === 0 ? (
            <EmptyState title="No campaigns yet" description="Generate a 30-day reactivation campaign to preview messages." />
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <ReactivationStudio
                  key={campaign.id}
                  campaign={{
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status,
                    recipients: campaign.recipients.map((item) => ({
                      id: item.id,
                      message: item.message,
                      status: item.status,
                      leadName: item.lead.name,
                    })),
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
