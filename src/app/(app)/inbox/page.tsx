import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { requireUser, canViewAllLeads } from "@/lib/authz";
import { formatRelative } from "@/lib/format";
import { leadVisibilityWhere } from "@/lib/leads/service";
import { db } from "@/lib/db";
import { TemperatureBadge } from "@/components/status-badge";

export default async function InboxPage() {
  const user = await requireUser();
  const leads = await db.lead.findMany({
    where: {
      ...leadVisibilityWhere(user.organizationId, user.id, canViewAllLeads(user.role)),
      messages: { some: {} },
    },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { lastContactedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Inbox"
        description="WhatsApp-style conversations. Demo mode works without provider credentials."
      />
      {leads.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description="Open a lead and send a message, or add a lead with an initial enquiry."
        />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/40"
            >
              <div>
                <p className="font-medium">{lead.name}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">
                  {lead.messages[0]?.body}
                </p>
              </div>
              <div className="text-right">
                <TemperatureBadge value={lead.temperature} />
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatRelative(lead.messages[0]?.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
