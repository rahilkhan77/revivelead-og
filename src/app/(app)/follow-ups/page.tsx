import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { FollowUpActions } from "@/components/follow-up-actions";
import { canViewAllLeads, requireUser } from "@/lib/authz";
import { formatDateTime } from "@/lib/format";
import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

export default async function FollowUpsPage() {
  const user = await requireUser();
  const items = await db.followUp.findMany({
    where: {
      organizationId: user.organizationId,
      ...(canViewAllLeads(user.role) ? {} : { assignedToId: user.id }),
    },
    include: { lead: true },
    orderBy: { dueAt: "asc" },
    take: 80,
  });

  return (
    <div>
      <PageHeader
        title="Follow-ups"
        description="Due work from the sequence engine. Run the engine to send anything that is due."
        actions={<FollowUpActions />}
      />
      {items.length === 0 ? (
        <EmptyState
          title="No follow-ups"
          description="New leads automatically receive a four-step sequence."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Link href={`/leads/${item.leadId}`} className="hover:underline">
                      {item.lead.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{item.type.replaceAll("_", " ")}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(item.dueAt)}</TableCell>
                  <TableCell className="text-sm">{item.status}</TableCell>
                  <TableCell>
                    <FollowUpActions id={item.id} status={item.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
